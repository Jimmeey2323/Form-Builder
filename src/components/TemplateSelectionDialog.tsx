import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Template, templateCategories, getTemplatesByCategory } from '@/data/templates';
import { Search, Sparkles, Plus } from 'lucide-react';

interface TemplateSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onCreateBlank: () => void;
}

export function TemplateSelectionDialog({
  open,
  onClose,
  onSelectTemplate,
  onCreateBlank,
}: TemplateSelectionDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = getTemplatesByCategory(selectedCategory).filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Choose a Template
          </DialogTitle>
          <DialogDescription>
            Start with a pre-built template or create a blank form from scratch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Blank Form Option */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={onCreateBlank}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Start from Scratch</h3>
                <p className="text-sm text-muted-foreground">Create a blank form and add your own fields</p>
              </div>
            </CardContent>
          </Card>

          {/* Categories and Templates */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6 bg-muted/50">
              {templateCategories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template)}
                  />
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">No templates found</h3>
                  <p className="text-xs text-muted-foreground">Try a different search term or category</p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all group border border-border hover:border-primary/30" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-lg border border-primary/20">
              {template.icon}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] mt-1">
                {template.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {template.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{template.fields.length} fields</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <span>Ready to use</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}