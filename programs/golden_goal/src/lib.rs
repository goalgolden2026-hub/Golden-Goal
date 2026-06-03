use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("GoalG11111111111111111111111111111111111111");

#[program]
pub mod golden_goal {
    use super::*;

    /// Initializes a user lock record state account.
    pub fn initialize_lock(
        ctx: Context<InitializeLock>,
        tier: u8,
        amount: u64,
        unlock_date: i64,
    ) -> Result<()> {
        let lock_state = &mut ctx.accounts.lock_state;
        lock_state.owner = ctx.accounts.owner.key();
        lock_state.tier = tier;
        lock_state.amount = amount;
        lock_state.unlock_date = unlock_date;
        lock_state.is_active = true;

        // Perform token transfer from owner to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(LockInitializedEvent {
            owner: lock_state.owner,
            amount,
            unlock_date,
            tier,
        });

        Ok(())
    }

    /// Unlocks tokens early with a 10% penalty or normally after the lock period expires.
    pub fn unlock_tokens(ctx: Context<UnlockTokens>) -> Result<()> {
        let lock_state = &mut ctx.accounts.lock_state;
        require!(lock_state.is_active, GoldenGoalError::LockAlreadyInactive);

        let clock = Clock::get()?;
        let is_early = clock.unix_timestamp < lock_state.unlock_date;
        let mut transfer_amount = lock_state.amount;

        if is_early {
            // Apply 10% early unlock penalty
            let penalty_amount = lock_state.amount / 10;
            transfer_amount = lock_state.amount - penalty_amount;

            // Burn 50% of the penalty
            let burn_amount = penalty_amount / 2;
            let cpi_accounts_burn = token::Burn {
                mint: ctx.accounts.vault_mint.to_account_info(),
                from: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            };
            // Sign CPI using vault authority seeds
            // (real program would pass signer seeds here)
            // token::burn(cpi_ctx, burn_amount)?;

            // Distribute remaining 50% of the penalty to reward pool
            let reward_dist_amount = penalty_amount - burn_amount;
            // token::transfer(cpi_ctx, reward_dist_amount)?;
        }

        // Transfer remaining locked tokens back to the owner
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        // Sign CPI using vault authority seeds
        // token::transfer(cpi_ctx, transfer_amount)?;

        lock_state.is_active = false;

        emit!(TokensUnlockedEvent {
            owner: lock_state.owner,
            amount: transfer_amount,
            is_early,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLock<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 1 + 8 + 8 + 1,
        seeds = [b"lock-state", owner.key().as_ref()],
        bump
    )]
    pub lock_state: Account<'info, LockState>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == pubkey!("Fk3kDaJbh4dBHNfDyiquXTiKZmbVS8BQ8bLvDy4aeJwm")
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"lock-state", owner.key().as_ref()],
        bump,
        has_one = owner,
    )]
    pub lock_state: Account<'info, LockState>,

    #[account(mut)]
    pub vault_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = vault_token_account.owner == pubkey!("Fk3kDaJbh4dBHNfDyiquXTiKZmbVS8BQ8bLvDy4aeJwm")
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: Vault PDA authority
    pub vault_authority: AccountInfo<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = reward_token_account.owner == pubkey!("5imEZhSwMUfx6XpyQCBqsCWxJKfmmF5JCNoxMWvB23cH")
    )]
    pub reward_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct LockState {
    pub owner: Pubkey,
    pub tier: u8,
    pub amount: u64,
    pub unlock_date: i64,
    pub is_active: bool,
}

#[error_code]
pub mod GoldenGoalError {
    #[msg("The lock record has already been set to inactive.")]
    LockAlreadyInactive,
    #[msg("Insufficient tokens in the user account.")]
    InsufficientUserFunds,
}

#[event]
pub struct LockInitializedEvent {
    pub owner: Pubkey,
    pub amount: u64,
    pub unlock_date: i64,
    pub tier: u8,
}

#[event]
pub struct TokensUnlockedEvent {
    pub owner: Pubkey,
    pub amount: u64,
    pub is_early: bool,
}
