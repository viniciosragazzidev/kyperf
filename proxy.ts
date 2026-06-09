import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("better-auth.session_token")?.value || 
                       request.cookies.get("__secure-better-auth.session_token")?.value;

  let isAuthenticated = false;
  let onboardingCompleted = false;

  if (sessionToken) {
    try {
      const getBaseUrl = () => request.nextUrl.origin;
      
      const res = await fetch(`${getBaseUrl()}/api/onboarding/status`, {
        headers: new Headers(request.headers),
      });

      if (res.ok) {
        const data = await res.json();
        isAuthenticated = !!data.authenticated;
        onboardingCompleted = !!data.onboardingCompleted;
      }
    } catch (err) {
      console.error("Erro ao verificar onboarding no proxy:", err);
    }
  }

  // 1. Não autenticado tentando acessar rotas protegidas (/panel ou /onboarding)
  if (pathname.startsWith('/panel') || pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Se estiver autenticado e sessão for válida
  if (isAuthenticated) {
    // Se o onboarding NÃO foi completado e tenta acessar qualquer rota diferente de /onboarding
    if (!onboardingCompleted && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Se o onboarding JÁ foi completado e tenta acessar /onboarding, vai para /panel
    if (onboardingCompleted && pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }

    // Redireciona usuários logados para o painel se tentarem acessar login ou register
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o proxy a todas as rotas exceto:
     * - api (rotas de API internas, inclusive better-auth)
     * - _next/static (arquivos estáticos de build)
     * - _next/image (arquivos de otimização de imagens)
     * - favicon.ico, arquivos de imagem comum e assets do public
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
}
