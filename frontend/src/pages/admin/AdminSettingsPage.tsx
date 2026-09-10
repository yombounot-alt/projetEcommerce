import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "@/app/providers/ThemeProvider";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateSettingsMutation } from "@/features/settings/api/useSettingsMutations";
import { useSettingsQuery } from "@/features/settings/api/useSettingsQuery";
import { settingsFormSchema, type SettingsFormValues } from "@/schemas/settings.schema";

export default function AdminSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { data: settings, isLoading } = useSettingsQuery();
  const updateSettings = useUpdateSettingsMutation();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { storeName: "", supportEmail: "" },
  });

  useEffect(() => {
    if (settings) form.reset(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  function onSubmit(values: SettingsFormValues) {
    updateSettings.mutate(values, {
      onSuccess: () => toast.success("Paramètres enregistrés."),
      onError: () => toast.error("Impossible d'enregistrer les paramètres."),
    });
  }

  return (
    <div className="space-y-6">
      <Seo title="Paramètres" noIndex />
      <PageHeader title="Paramètres" description="Configurez les préférences générales de la plateforme." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Informations de la boutique</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState className="min-h-[10vh]" label="Chargement des paramètres…" />
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la boutique</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de support</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Apparence</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="dark-theme">Thème sombre</Label>
                <p className="text-xs text-muted-foreground">Actuellement : {resolvedTheme === "dark" ? "sombre" : "clair"}</p>
              </div>
              <Switch
                id="dark-theme"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
