"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ConfiguracionPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);

  return (
    <main className="p-8 flex justify-center">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#0C2D57]">
            Configuración Personal
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode" className="text-gray-700">
              Activar modo oscuro
            </Label>
            <Switch
              id="darkMode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notificaciones" className="text-gray-700">
              Recibir notificaciones
            </Label>
            <Switch
              id="notificaciones"
              checked={notificaciones}
              onCheckedChange={setNotificaciones}
            />
          </div>

          <p className="text-sm text-gray-500">
            Las preferencias se guardarán automáticamente para tu próxima sesión.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
