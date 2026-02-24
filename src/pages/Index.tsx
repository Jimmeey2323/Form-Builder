import { useState, useCallback } from 'react';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { FieldCard } from '@/components/form-builder/FieldCard';
import { FieldEditorDialog } from '@/components/form-builder/FieldEditorDialog';
import { AddFieldMenu } from '@/components/form-builder/AddFieldMenu';
import { FormPreview } from '@/components/form-builder/FormPreview';
import { HtmlExportDialog } from '@/components/form-builder/HtmlExportDialog';
import { FormSettingsPanel } from '@/components/form-builder/FormSettingsPanel';
import { generateFormHtml } from '@/utils/htmlGenerator';
import { FormField } from '@/types/formField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code,
  Eye,
  Settings,
  Plus,
  Trash2,
  Share2,
  FileCode,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const {
    forms,
    activeForm,
    activeFormId,
    setActiveFormId,
    createForm,
    deleteForm,
    updateForm,
    addField,
    updateField,
    deleteField,
    moveField,
    duplicateField,
  } = useFormBuilder();

  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [mainTab, setMainTab] = useState('fields');

  // removed unused handler

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">FormCraft</h1>
          </div>
          <div className="flex items-center gap-2">
            {activeForm && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
                  <Code className="h-3.5 w-3.5 mr-1.5" />
                  Export HTML
                </Button>
                <Button size="sm" onClick={() => {
                  if (!activeForm) return;
                  const html = generateFormHtml(activeForm);
                  const blob = new Blob([html], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}>
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Share / Preview
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar — Form List */}
          <aside className="col-span-12 lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">My Forms</CardTitle>
                  <Button size="sm" variant="outline" onClick={createForm}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 p-3 pt-0">
                {forms.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No forms yet. Create one!
                  </p>
                )}
                {forms.map(form => (
                  <div
                    key={form.id}
                    onClick={() => setActiveFormId(form.id)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${
                      activeFormId === form.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{form.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {form.fields.length}f
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {!activeForm ? (
              <Card className="flex flex-col items-center justify-center py-20">
                <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Create Your First Form</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Build beautiful HTML forms with advanced field types
                </p>
                <Button onClick={createForm}>
                  <Plus className="h-4 w-4 mr-2" /> New Form
                </Button>
              </Card>
            ) : (
              <Tabs value={mainTab} onValueChange={setMainTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="fields">
                      <Layers className="h-3.5 w-3.5 mr-1.5" /> Fields
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    {mainTab === 'fields' && <AddFieldMenu onAdd={type => addField(activeForm.id, type)} />}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (window.confirm('Delete this form?')) {
                          deleteForm(activeForm.id);
                          toast.success('Form deleted');
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <TabsContent value="fields">
                  {activeForm.fields.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-16">
                      <p className="text-muted-foreground mb-4 text-sm">
                        No fields yet. Add your first field to get started.
                      </p>
                      <AddFieldMenu onAdd={type => addField(activeForm.id, type)} />
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {[...activeForm.fields]
                        .sort((a, b) => a.order - b.order)
                        .map((field, i, arr) => (
                          <FieldCard
                            key={field.id}
                            field={field}
                            onEdit={() => setEditingField(field)}
                            onDelete={() => {
                              deleteField(activeForm.id, field.id);
                              toast.success('Field deleted');
                            }}
                            onDuplicate={() => {
                              duplicateField(activeForm.id, field.id);
                              toast.success('Field duplicated');
                            }}
                            onMoveUp={() => moveField(activeForm.id, field.id, 'up')}
                            onMoveDown={() => moveField(activeForm.id, field.id, 'down')}
                            isFirst={i === 0}
                            isLast={i === arr.length - 1}
                          />
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preview">
                  <FormPreview form={activeForm} />
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardContent className="pt-6">
                      <FormSettingsPanel
                        form={activeForm}
                        onUpdate={updates => updateForm(activeForm.id, updates)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      {editingField && activeForm && (
        <FieldEditorDialog
          field={editingField}
          open={!!editingField}
          onClose={() => setEditingField(null)}
          onSave={updates => updateField(activeForm.id, editingField.id, updates)}
          allFields={activeForm.fields}
        />
      )}

      {activeForm && (
        <HtmlExportDialog
          form={activeForm}
          open={showExport}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default Index;
