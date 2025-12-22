import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, 
  Shield, 
  Sword, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Rocket,
  CheckCircle,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
});

export default function Auth() {
  const [activeCard, setActiveCard] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validate = (isLogin: boolean) => {
    try {
      const data = isLogin 
        ? { email, password }
        : { email, password, displayName: displayName || undefined };
      authSchema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(true)) return;
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(false)) return;
    setLoading(true);

    try {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Conta criada com sucesso!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) toast.error(error.message);
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !z.string().email().safeParse(email).success) {
      setErrors({ email: 'Email inválido' });
      return;
    }
    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResetEmailSent(true);
        toast.success('Email de recuperação enviado!');
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Login Card Component
  const LoginCard = () => (
    <section className={`relative w-full max-w-md mx-auto bg-slate-900 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800 transition-all duration-300 ${activeCard === 'login' ? 'ring-2 ring-primary/50' : ''}`}>
      <header className="flex items-center justify-between px-6 pt-6">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <button 
          onClick={() => setActiveCard('forgot')}
          className="text-sm font-medium text-slate-500 hover:text-primary transition-colors duration-200"
        >
          Esqueceu a senha?
        </button>
      </header>
      
      <div className="flex-1 flex flex-col px-6 pt-8 pb-8 gap-8">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-4">
          <img src="/lovable-uploads/efa0d41b-14e0-4651-a827-05d928549cb9.png" alt="Go20" className="w-24 h-24 object-contain" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-slate-500 mt-1">Entre na sua conta Go20</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Endereço de Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onClick={() => setActiveCard('login')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-slate-100"
            />
            {errors.email && activeCard === 'login' && (
              <p className="text-sm text-red-400">{errors.email}</p>
            )}
          </div>
          
          <div className="relative space-y-2">
            <Label htmlFor="login-password" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onClick={() => setActiveCard('login')}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pr-12 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-slate-100"
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && activeCard === 'login' && (
              <p className="text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-blue-700 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2"
            disabled={loading && activeCard === 'login'}
          >
            {loading && activeCard === 'login' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            Entrar no Painel
          </Button>
        </form>

        {/* Social Login */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Ou continuar com</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <div className="flex justify-center">
          <Button 
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-8 rounded-xl transition-all duration-200 border border-slate-700"
            onClick={handleGoogleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com Google
          </Button>
        </div>
      </div>
      
      <footer className="text-center text-sm pb-6 px-6 border-t border-slate-800 pt-6">
        <p className="text-slate-500">
          Novo no Go20?{' '}
          <button 
            onClick={() => setActiveCard('signup')}
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Criar conta
          </button>
        </p>
      </footer>
    </section>
  );

  // Forgot Password Card Component
  const ForgotPasswordCard = () => (
    <section className="relative w-full max-w-md mx-auto bg-slate-900 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800 transition-all duration-300 ring-2 ring-amber-500/50">
      <header className="flex items-center px-6 pt-6">
        <button 
          onClick={() => {
            setActiveCard('login');
            setResetEmailSent(false);
            setErrors({});
          }}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
      </header>
      
      <div className="flex-1 flex flex-col px-6 pt-8 pb-8 gap-8">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-4">
          <img src="/lovable-uploads/efa0d41b-14e0-4651-a827-05d928549cb9.png" alt="Go20" className="w-24 h-24 object-contain" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Recuperar Senha</h1>
            <p className="text-sm text-slate-500 mt-1">Enviaremos um link para redefinir sua senha</p>
          </div>
        </div>

        {resetEmailSent ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-slate-100">Email Enviado!</h2>
              <p className="text-sm text-slate-400 max-w-xs">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
            </div>
            <Button 
              onClick={() => {
                setActiveCard('login');
                setResetEmailSent(false);
              }}
              className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Voltar para Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Endereço de Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-slate-100"
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
              Enviar Link de Recuperação
            </Button>
          </form>
        )}
      </div>
      
      <footer className="text-center text-sm pb-6 px-6 border-t border-slate-800 pt-6">
        <p className="text-slate-500">
          Lembrou a senha?{' '}
          <button 
            onClick={() => {
              setActiveCard('login');
              setResetEmailSent(false);
            }}
            className="font-semibold text-amber-500 hover:text-amber-400 transition-colors"
          >
            Fazer login
          </button>
        </p>
      </footer>
    </section>
  );

  // Hero Card Component (desktop only)
  const HeroCard = () => (
    <section className="hidden xl:flex relative w-full max-w-md mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex-col text-white border border-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" />
      <div className="relative flex-1 flex flex-col items-center justify-center p-8 gap-8">
        <div className="w-full aspect-square max-w-xs relative rounded-2xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-orange-500/10 to-purple-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-32 h-32 text-primary/30" />
          </div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2aDZ2Nmg2di02aDZ2LTZoLTZ2Nmgtdjb2gtNnY2aC02djZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        </div>
        
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="leading-tight text-3xl font-semibold tracking-tight">
            Transforme Suas Aventuras
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Gerencie personagens, campanhas e combates com ferramentas poderosas feitas para mestres e jogadores.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button 
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-4 rounded-xl hover:bg-slate-100 transition-all duration-300 shadow-lg"
            onClick={() => setActiveCard('signup')}
          >
            <Rocket className="w-5 h-5" />
            Começar Gratuitamente
          </Button>
          
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 mt-2">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Sem Cartão
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Dados Seguros
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Signup Card Component
  const SignupCard = () => (
    <section className={`relative w-full max-w-md mx-auto bg-slate-900 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800 transition-all duration-300 ${activeCard === 'signup' ? 'ring-2 ring-emerald-500/50' : ''}`}>
      <div className="px-6 pt-8 pb-8 flex-1 flex flex-col gap-6">
        <header className="text-center space-y-2">
          <img src="/lovable-uploads/efa0d41b-14e0-4651-a827-05d928549cb9.png" alt="Go20" className="w-24 h-24 object-contain mx-auto" />
          <h2 className="text-2xl font-semibold text-slate-100 tracking-tight">Junte-se ao Go20</h2>
          <p className="text-sm text-slate-500">Crie sua conta e comece a explorar</p>
        </header>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-sm font-semibold text-slate-300">Nome de Aventureiro</Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Como você quer ser chamado?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onClick={() => setActiveCard('signup')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-slate-100"
            />
            {errors.displayName && activeCard === 'signup' && (
              <p className="text-sm text-red-400">{errors.displayName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Endereço de Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onClick={() => setActiveCard('signup')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-slate-100"
            />
            {errors.email && activeCard === 'signup' && (
              <p className="text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="relative space-y-2">
            <Label htmlFor="signup-password" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Criar Senha
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onClick={() => setActiveCard('signup')}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pr-12 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-slate-100"
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && activeCard === 'signup' && (
              <p className="text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2"
            disabled={loading && activeCard === 'signup'}
          >
            {loading && activeCard === 'signup' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            Criar Sua Conta
          </Button>
        </form>

        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Ou continuar com</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <div className="flex justify-center">
          <Button 
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-8 rounded-xl transition-all duration-200 border border-slate-700"
            onClick={handleGoogleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com Google
          </Button>
        </div>

        <footer className="text-center text-sm pt-4 border-t border-slate-800">
          <p className="text-slate-500">
            Já tem uma conta?{' '}
            <button 
              onClick={() => setActiveCard('login')}
              className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Fazer login
            </button>
          </p>
        </footer>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-slate-900 to-purple-900/20" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Desktop: Show all 3 cards or forgot password */}
      <main className="relative z-10 w-full max-w-7xl mx-auto hidden xl:flex flex-row gap-6 lg:gap-8">
        {activeCard === 'forgot' ? (
          <div className="w-full flex justify-center">
            <ForgotPasswordCard />
          </div>
        ) : (
          <>
            <LoginCard />
            <HeroCard />
            <SignupCard />
          </>
        )}
      </main>

      {/* Mobile/Tablet: Show only active card */}
      <main className="relative z-10 w-full max-w-md mx-auto xl:hidden">
        {activeCard === 'login' && <LoginCard />}
        {activeCard === 'signup' && <SignupCard />}
        {activeCard === 'forgot' && <ForgotPasswordCard />}
      </main>
    </div>
  );
}
