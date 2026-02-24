import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormTheme } from '@/types/formField';
import { predefinedThemes, Theme } from '@/data/themes';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTheme: (theme: FormTheme) => void;
  currentTheme?: FormTheme;
}

export function ThemeSelectionDialog({
  open,
  onClose,
  onSelectTheme,
  currentTheme,
}: ThemeSelectionDialogProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const handleApplyTheme = () => {
    if (selectedTheme) {
      onSelectTheme(selectedTheme.config);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Palette className="h-5 w-5 text-primary" />
            Choose a Theme
          </DialogTitle>
          <DialogDescription>
            Select a predefined theme to instantly style your form
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
            {predefinedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={selectedTheme?.id === theme.id}
                onSelect={() => setSelectedTheme(theme)}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyTheme} 
              disabled={!selectedTheme}
              className="bg-primary text-primary-foreground"
            >
              Apply Theme
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  const config = theme.config;
  
  return (
    <Card 
      className={`cursor-pointer transition-all group border-2 ${
        isSelected 
          ? 'border-primary shadow-md ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50'
      }`} 
      onClick={onSelect}
    >
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
              {theme.name}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className="text-[10px] mt-1"
              style={{ backgroundColor: config.primaryColor + '20', color: config.primaryColor }}
            >
              {theme.category}
            </Badge>
          </div>
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Color palette preview */}
        <div className="flex gap-1 mb-3">
          <div 
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: config.primaryColor }}
            title="Primary Color"
          />
          <div 
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: config.secondaryColor }}
            title="Secondary Color"
          />
          <div 
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: config.backgroundColor }}
            title="Background"
          />
          <div 
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: config.textColor }}
            title="Text Color"
          />
        </div>
        
        {/* Theme preview */}
        <div 
          className="p-3 rounded-lg border text-xs space-y-2"
          style={{ 
            backgroundColor: config.backgroundColor,
            borderColor: config.inputBorderColor,
            color: config.textColor
          }}
        >
          <div 
            className="text-xs font-semibold"
            style={{ color: config.primaryColor }}
          >
            Sample Form Field
          </div>
          <div 
            className="w-full h-6 rounded border px-2 flex items-center text-xs opacity-60"
            style={{ borderColor: config.inputBorderColor }}
          >
            Input field preview
          </div>
          <div 
            className="w-16 h-5 rounded text-[10px] flex items-center justify-center"
            style={{ 
              backgroundColor: config.primaryColor,
              color: config.backgroundColor 
            }}
          >
            Button
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {theme.description}
        </p>
      </CardContent>
    </Card>
  );
}