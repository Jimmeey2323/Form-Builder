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
import { Search, Sparkles, Plus, Upload, Trash2, Star } from 'lucide-react';

interface TemplateSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onCreateBlank: () => void;
  /** User-created templates (from CSV import or manual saves) */
  userTemplates?: Template[];
  /** Called when user clicks the "Import CSV" button */
  onImportCsv?: () => void;
  /** Called when user deletes a user template */
  onDeleteTemplate?: (id: string) => void;
}

export function TemplateSelectionDialog({
  open,
  onClose,
  onSelectTemplate,
  onCreateBlank,
  userTemplates = [],
  onImportCsv,
  onDeleteTemplate,
}: TemplateSelectionDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const builtInFiltered = getTemplatesByCategory(selectedCategory).filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userFiltered = userTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFiltered = searchQuery
    ? [...builtInFiltered, ...userFiltered]
    : builtInFiltered;

  const [mainTab, setMainTab] = useState<'library' | 'mine'>('library');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                Choose a Template
              </DialogTitle>
              <DialogDescription className="mt-1">
                Start with a pre-built template, import from CSV, or create a blank form
              </DialogDescription>
            </div>
            {onImportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={onImportCsv}
                className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50 shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                Import CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Blank form quick card */}
          <Card
            className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={onCreateBlank}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Start from Scratch</h3>
                <p className="text-xs text-muted-foreground">Create a blank form and add your own fields</p>
              </div>
            </CardContent>
          </Card>

          {/* Library / My Templates tab switcher */}
          {!searchQuery && (
            <div className="flex gap-2 border-b border-border pb-1">
              <button
                onClick={() => setMainTab('library')}
                className={`text-sm font-medium pb-2 px-1 border-b-2 transition-colors ${
                  mainTab === 'library'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Template Library
              </button>
              <button
                onClick={() => setMainTab('mine')}
                className={`text-sm font-medium pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                  mainTab === 'mine'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                My Templates
                {userTemplates.length > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary font-semibold rounded-full px-1.5">
                    {userTemplates.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ── Library tab ── */}
          {mainTab === 'library' && !searchQuery && (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-5 bg-muted/50 mb-4">
                {templateCategories.slice(0, 5).map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                {builtInFiltered.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => { onSelectTemplate(template); onClose(); }}
                  />
                ))}
                {builtInFiltered.length === 0 && <EmptyState />}
              </div>
            </Tabs>
          )}

          {/* ── My Templates tab ── */}
          {mainTab === 'mine' && !searchQuery && (
            <div className="space-y-3">
              {userTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Star className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">No saved templates yet</h3>
                    <p className="text-xs text-muted-foreground">
                      Import a CSV file to generate and save your own templates
                    </p>
                  </div>
                  {onImportCsv && (
                    <Button variant="outline" size="sm" onClick={onImportCsv} className="gap-2">
                      <Upload className="h-3.5 w-3.5" /> Import from CSV
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                  {userTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => { onSelectTemplate(template); onClose(); }}
                      onDelete={onDeleteTemplate ? () => onDeleteTemplate(template.id) : undefined}
                      isUserCreated
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Search results ── */}
          {searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
              {allFiltered.length > 0 ? (
                allFiltered.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => { onSelectTemplate(template); onClose(); }}
                    onDelete={template.isUserCreated && onDeleteTemplate ? () => onDeleteTemplate(template.id) : undefined}
                    isUserCreated={template.isUserCreated}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <h3 className="font-semibold text-sm mb-1">No templates found</h3>
      <p className="text-xs text-muted-foreground">Try a different search term or category</p>
    </div>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────
interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
  onDelete?: () => void;
  isUserCreated?: boolean;
}

function TemplateCard({ template, onSelect, onDelete, isUserCreated }: TemplateCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all group border border-border hover:border-primary/30 relative"
      onClick={onSelect}
    >
      {isUserCreated && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center"
              title="Delete template"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          <Badge className="text-[9px] px-1.5 py-0 bg-violet-100 text-violet-700 border border-violet-200">
            <Star className="h-2 w-2 mr-0.5 fill-violet-500 text-violet-500" /> Saved
          </Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-lg border border-primary/20 shrink-0">
            {template.icon}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
              {template.name}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{template.category}</Badge>
              {template.subCategory && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">{template.subCategory}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
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