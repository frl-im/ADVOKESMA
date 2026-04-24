// types/next-auth.d.ts
// Extend NextAuth's default Session and JWT types with custom fields
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            nim: string;
            role: string;
            prodiId: string | null;
            prodi: {
                id: string;
                name: string;
                faculty: {
                    id: string;
                    name: string;
                    universityId: string;
                };
            } | null;
        };
    }

    interface User {
        nim: string;
        role: string;
        prodiId: string | null;
        prodi: any | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        nim: string;
        role: string;
        prodiId: string | null;
        prodi: any | null;
    }
}
