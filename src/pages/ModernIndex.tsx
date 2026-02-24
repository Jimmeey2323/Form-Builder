import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { FieldEditorDialog } from '@/components/form-builder/FieldEditorDialog';
import { FormPreview } from '@/components/form-builder/FormPreview';
import { HtmlExportDialog } from '@/components/form-builder/HtmlExportDialog';
import { ModernSettingsPanel } from '@/components/form-builder/ModernSettingsPanel';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { TestSubmission } from '@/components/TestSubmission';
import { FormCard } from '@/components/FormCard';
import { TemplateSelectionDialog } from '@/components/TemplateSelectionDialog';
import { EnhancedSidebar } from '@/components/form-builder/EnhancedSidebar';
import { generateFormHtml, convertImageToBase64 } from '@/utils/htmlGenerator';
import { FormField, FieldType } from '@/types/formField';
import { Template } from '@/data/templates';
import { getRandomHeroImage } from '@/data/heroImages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Plus,
  Eye,
  Rocket,
  Loader2,
  MoreHorizontal,
  Search,
  Grid3X3,
  List,
  CheckSquare,
  Square,
  Copy,
  Trash2,
  Archive,
  Users,
  TrendingUp,
  Sparkles,
  Layout,
  Palette,
  Menu,
  X,
  Home,
  FileText,
  BarChart3,
  Shield,
  ArrowLeft,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

async function generateHtmlWithEmbeddedLogo(form: any): Promise<string> {
  let logoBase64: string | undefined;
  if (form.theme.showLogo && form.theme.logoUrl) {
    try {
      logoBase64 = await convertImageToBase64(form.theme.logoUrl);
    } catch {
      // fallback - logo won't be embedded
    }
  }
  return generateFormHtml(form, { logoBase64 });
}

const ModernIndex = () => {
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
    reorderFields,
    duplicateField,
  } = useFormBuilder();

  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'builder' | 'settings'>('dashboard');
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  
  // Modern UI features
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // DnD sensors for drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Dialogs
  const [confirmDeleteForm, setConfirmDeleteForm] = useState(false);
  const [confirmDeploy, setConfirmDeploy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Sync persisted deploy URL when the active form changes
  useEffect(() => {
    setDeployUrl(activeForm?.deployedUrl ?? null);
  }, [activeForm?.id]);

  const handleDeploy = async () => {
    if (!activeForm) return;
    setDeploying(true);
    try {
      const html = await generateHtmlWithEmbeddedLogo(activeForm);
      console.log('Starting deployment for form:', activeForm.title);
      
      const { data, error } = await supabase.functions.invoke('deploy-to-vercel', {
        body: { html, formTitle: activeForm.title, formId: activeForm.id, vercelProjectDomain: activeForm.vercelProjectDomain, deployedUrl: activeForm.deployedUrl },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      if (data?.url) {
        console.log('Deployment successful. Live URL from Vercel:', data.url);
        setDeployUrl(data.url);
        updateForm(activeForm.id, { deployedUrl: data.url });
        toast.success(`Form deployed successfully! Live at: ${data.url}`);
      }
    } catch (err: any) {
      console.error('Deployment failed:', err);
      toast.error('Deploy failed: ' + (err.message || 'Unknown error'));
    } finally {
      setDeploying(false);
    }
  };

  // Copy form functionality
  const handleCopyForm = (formToCopy: any) => {
    const newForm = {
      ...formToCopy,
      id: `form_${Date.now()}`,  
      title: `${formToCopy.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deployedUrl: undefined, // Clear deployment URL for copy
      vercelProjectDomain: undefined, // Clear Vercel project domain
    };
    
    const created = createForm();
    if (created) {
      updateForm(created.id, newForm);
      setActiveFormId(created.id);  
      toast.success(`Form "${formToCopy.title}" copied successfully!`);
    }
  };

  // Template selection handlers
  const handleSelectTemplate = (template: Template) => {
    const newForm = createForm();
    if (newForm) {
      const updatedForm = {
        ...newForm,
        title: template.name,
        description: template.description,
        fields: template.fields.map((field, index) => ({
          ...field,
          id: `field_${Date.now()}_${index}`,
          order: index
        })),
        theme: {
          ...newForm.theme,
          heroImage: getRandomHeroImage(), // Add random hero image
        },
        ...template.config
      };
      updateForm(newForm.id, updatedForm);
      setActiveFormId(newForm.id);
      setShowTemplateDialog(false);
      setCurrentView('builder');
      toast.success(`Form created from "${template.name}" template`);
    }
  };

  const handleCreateBlankForm = () => {
    const newForm = createForm();
    if (newForm) {
      // Add random hero image to blank forms too
      const updatedForm = {
        ...newForm,
        theme: {
          ...newForm.theme,
          heroImage: getRandomHeroImage(),
        },
      };
      updateForm(newForm.id, updatedForm);
      setActiveFormId(newForm.id);
      setShowTemplateDialog(false);
      setCurrentView('builder');
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedForms.size === forms.length) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(forms.map(f => f.id)));
    }
  };

  const handleSelectForm = (formId: string) => {
    const newSelection = new Set(selectedForms);
    if (newSelection.has(formId)) {
      newSelection.delete(formId);
    } else {
      newSelection.add(formId);
    }
    setSelectedForms(newSelection);
  };

  const handleBulkDelete = () => {
    selectedForms.forEach(formId => {
      deleteForm(formId);
    });
    setSelectedForms(new Set());
    setConfirmBulkDelete(false);
    toast.success(`Deleted ${selectedForms.size} forms`);
  };

  // Filter forms based on search
  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="text-slate-600 hover:text-slate-900"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Form Builder</h1>
                <p className="text-sm text-slate-500">Create beautiful forms in minutes</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              {forms.length} forms
            </Badge>
            <Button 
              onClick={() => setShowTemplateDialog(true)} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Controls */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedForms.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedForms.size} form(s) selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedForms(new Set())}>
                  Clear
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setConfirmBulkDelete(true)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No forms yet</h3>
              <p className="text-slate-500 mb-6">Get started by creating your first form</p>
              <Button onClick={() => setShowTemplateDialog(true)} className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Form
              </Button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                viewMode={viewMode}
                isActive={activeForm?.id === form.id}
                isSelected={selectedForms.has(form.id)}
                onSelect={() => {
                  setActiveFormId(form.id);
                  setCurrentView('builder');
                }}
                onToggleSelect={() => handleSelectForm(form.id)}
                onCopy={() => handleCopyForm(form)}
                onDelete={() => {
                  deleteForm(form.id);
                  toast.success('Form deleted');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBuilder = () => {
    if (!activeForm) return null;

    return (
      <div className="min-h-screen bg-slate-50 flex">
        {/* Enhanced Sidebar */}
        <EnhancedSidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onAddField={(type) => addField(activeForm.id, type)}
          onOpenTemplates={() => setShowTemplateDialog(true)}
        />
        
        {/* Main Builder Area */}
        <div className="flex-1 flex flex-col">
          {/* Builder Header */}
          <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentView('dashboard')}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">{activeForm.title}</h1>
                  <p className="text-sm text-slate-500">{activeForm.fields?.length || 0} fields</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setCurrentView('settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                >
                  {deploying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-2" />
                  )}
                  {deploying ? 'Deploying...' : 'Deploy'}
                </Button>
              </div>
            </div>
          </div>

          {/* Builder Content */}
          <div className="flex-1 p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                
                if (!over) return;
                
                // Handle dropping a new field from sidebar
                if (active.data.current?.type === 'field' && over.id === 'canvas') {
                  const fieldType = active.data.current.fieldType as FieldType;
                  addField(activeForm.id, fieldType);
                  return;
                }
                
                // Handle reordering existing fields
                if (active.id !== over.id) {
                  const oldIndex = activeForm.fields?.findIndex(f => f.id === active.id) ?? -1;
                  const newIndex = activeForm.fields?.findIndex(f => f.id === over.id) ?? -1;
                  
                  if (oldIndex !== -1 && newIndex !== -1 && activeForm.fields) {
                    const newFields = arrayMove(activeForm.fields, oldIndex, newIndex);
                    updateForm(activeForm.id, { fields: newFields });
                  }
                }
              }}
            >
              <FormCanvas
                form={activeForm}
                onEdit={setEditingField}
                onDelete={(id) => deleteField(activeForm.id, id)}
                onDuplicate={(id) => duplicateField(activeForm.id, id)}
                onAdd={(type) => addField(activeForm.id, type)}
                onReorder={(orderedIds) => {
                  const fieldsMap = (activeForm.fields || []).reduce((map, field) => {
                    map[field.id] = field;
                    return map;
                  }, {} as Record<string, any>);
                  
                  const orderedFields = orderedIds.map(id => fieldsMap[id]).filter(Boolean);
                  reorderFields(activeForm.id, orderedFields);
                }}
              />
            </DndContext>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (!activeForm) return null;

    return (
      <ModernSettingsPanel 
        form={activeForm}
        onUpdate={(updates) => updateForm(activeForm.id, updates)}
      />
    );
  };

  return (
    <>
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'builder' && renderBuilder()}
      {currentView === 'settings' && renderSettings()}

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

      <TemplateSelectionDialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateBlank={handleCreateBlankForm}
      />

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Forms</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedForms.size} form(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete Forms
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ModernIndex;