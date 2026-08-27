import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/constants/app.constants";
import { useTheme } from "@/app/providers/ThemeProvider";

export default function AdminSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Seo title="Paramètres" noIndex />
      <PageHeader title="Paramètres" description="Configurez les préférences générales de la plateforme." />

      <Tabs defaultValue="general" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Informations de la boutique</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="store-name">Nom de la boutique</Label>
                <Input id="store-name" defaultValue={APP_NAME} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-email">Email de support</Label>
                <Input id="support-email" type="email" defaultValue="support@lumera.example" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Thème sombre</p>
                  <p className="text-xs text-muted-foreground">Actuellement : {resolvedTheme === "dark" ? "sombre" : "clair"}</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
              <Button onClick={() => toast.success("Paramètres enregistrés.")}>Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Préférences de notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {["Nouvelles commandes", "Alertes de stock faible", "Nouveaux avis clients"].map((label) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Sécurité</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Authentification à deux facteurs</p>
                  <p className="text-xs text-muted-foreground">Recommandée pour les comptes administrateurs.</p>
                </div>
                <Switch />
              </div>
              <p className="text-xs text-muted-foreground">
                Les sessions sont gérées côté serveur via cookies sécurisés HttpOnly lors de l'intégration backend.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
