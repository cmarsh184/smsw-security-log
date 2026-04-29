import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const basicAuth = request.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const decoded = atob(authValue);
    const [user, password] = decoded.split(":");

    const validUser = process.env.DASHBOARD_USERNAME;
    const validPassword = process.env.DASHBOARD_PASSWORD;

    if (user === validUser && password === validPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="SMSW Dashboard"',
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};