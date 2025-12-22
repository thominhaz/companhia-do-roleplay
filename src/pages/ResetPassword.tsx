import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, Sword, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação deve ter pelo menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from a password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // The user will have a session if they clicked the reset link
      if (session) {
        setIsValidSession(true);
      } else {
        toast.error('Link de redefinição inválido ou expirado');
        navigate('/auth');
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  const validate = () => {
    try {
      passwordSchema.parse({ password, confirmPassword });
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Senha atualizada com sucesso!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-slate-900 to-purple-900/20" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 w-full max-w-md mx-auto">
        <section className="relative w-full bg-slate-900 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
          <header className="flex items-center px-6 pt-6">
            <button 
              onClick={() => navigate('/auth')}
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
                <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Nova Senha</h1>
                <p className="text-sm text-slate-500 mt-1">Crie uma nova senha para sua conta Go20</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="relative space-y-2">
                <Label htmlFor="new-password" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <div className="relative space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pr-12 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-slate-100"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-blue-700 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
                Atualizar Senha
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
