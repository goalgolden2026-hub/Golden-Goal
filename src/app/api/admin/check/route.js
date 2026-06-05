import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');
        
        if (!wallet) {
            return NextResponse.json({ success: true, authorized: false }, { status: 200 });
        }
        
        // Strictly server-side environment variable (no NEXT_PUBLIC_ prefix, totally safe!)
        const adminWalletsString = process.env.ADMIN_WALLET || "";
        const authorizedWallets = adminWalletsString.split(',').map(w => w.trim()).filter(Boolean);
        
        const isAuthorized = authorizedWallets.includes(wallet);
        return NextResponse.json({ success: true, authorized: isAuthorized }, { status: 200 });
    } catch (error) {
        console.error("GET /api/admin/check error:", error);
        return NextResponse.json({ success: false, authorized: false }, { status: 500 });
    }
}
