# Contributing to Golden Goal

We welcome contributions to the Golden Goal predictive forecasting platform! Whether you're fixing bugs, improving docs, writing tests, or proposing Anchor smart contract optimizations, your support is invaluable.

## Code of Conduct

By participating, you agree to uphold our professional standards as defined in our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Please report any violations or security concerns to security@goldengoalsol.com.

## How to Contribute

1. **Fork the Repository**: Create a fork of the codebase on GitHub.
2. **Create a Feature Branch**: Use descriptive branch names: `git checkout -b feature/your-feature-name` or `bugfix/issue-description`.
3. **Rust & Solana Program Changes**: All Anchor code modifications must live in `/program/src/lib.rs`.
4. **Jest Test Verification**: When adding frontend logic or database utilities, write matching unit tests inside the `src/__tests__` directory.
5. **Open a Pull Request**: Submit a detailed PR explaining the motivation, changes, and verification tests executed.

## Testing Guidelines

We enforce strict automated test gates to guarantee code maturity and platform stability.

### 🧪 Frontend & Serverless Tests (Next.js)
We utilize Jest for core logic, whitelist checking, tier calculations, and odds verification:
```bash
# Run the complete Jest test suite
npm run test
```
Please ensure all test suites pass successfully and that no warnings are thrown during Next.js production builds:
```bash
npm run build
```

### 🦀 Smart Contract Tests (Solana Anchor)
If you modify Rust smart contracts under the `program/` workspace:
1. Ensure the Solana CLI, Rust, and Anchor CLI (v0.29+) are installed.
2. Build the Anchor program locally:
   ```bash
   cd program
   anchor build
   ```
3. Run the integration test suite on the local Solana test validator:
   ```bash
   anchor test
   ```

Thank you for contributing to the future of decentralized sports prediction economies!
