import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Checklist() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/CHECKLIST_TESTES_GO20.md")
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch(() => toast.error("Erro ao carregar checklist"));
  }, []);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CHECKLIST_TESTES_GO20.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Checklist de Testes</h1>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Baixar .md
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 overflow-auto max-h-[80vh]">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
            {content || "Carregando..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
