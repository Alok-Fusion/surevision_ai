import { DecisionForm } from "@/components/forms/decision-form";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopilotDropzone } from "@/components/copilot/dropzone";

export default function AnalyzePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analyze Decision
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Submit a new business decision for AI analysis. Use the Copilot to drop a file, or enter details manually.
          </p>
        </div>

        <Tabs defaultValue="auto" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="auto" className="text-sm font-medium">
              ⚡ Copilot (File Drop)
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-sm font-medium">
              ✏️ Manual Input
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="auto" className="mt-0">
            <CopilotDropzone />
          </TabsContent>
          
          <TabsContent value="manual" className="mt-0">
            <DecisionForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

