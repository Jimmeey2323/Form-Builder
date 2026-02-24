import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FieldType, FIELD_TYPE_CATEGORIES, FIELD_TYPE_LABELS } from '@/types/formField';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Type, Mail, Phone, Hash, Link, Eye, AlignLeft,
  ChevronDown, Circle, CheckSquare, Star, Calendar,
  FileImage, Palette, Signature, Minus, FileCode,
  BarChart, Variable, GitBranch, Clock, FileUp,
  Plus, ChevronRight, Grid, Layout, Sparkles,
  Mouse, Archive, Settings, Target, Database,
  FormInput, Layers, Code2, Zap, PaintBucket,
  SlidersHorizontal
} from 'lucide-react';

// Field type icon mapping
const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  tel: <Phone className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  url: <Link className="h-4 w-4" />,
  password: <Eye className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  select: <ChevronDown className="h-4 w-4" />,
  radio: <Circle className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  time: <Clock className="h-4 w-4" />,
  'datetime-local': <Calendar className="h-4 w-4" />,
  file: <FileUp className="h-4 w-4" />,
  range: <SlidersHorizontal className="h-4 w-4" />,
  color: <Palette className="h-4 w-4" />,
  hidden: <Eye className="h-4 w-4" />,
  lookup: <Database className="h-4 w-4" />,
  formula: <Variable className="h-4 w-4" />,
  conditional: <GitBranch className="h-4 w-4" />,
  dependent: <Link className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
  signature: <Signature className="h-4 w-4" />,
  'section-break': <Minus className="h-4 w-4" />,
  'page-break': <FileCode className="h-4 w-4" />,
};

// Draggable field component
interface DraggableFieldProps {
  type: FieldType;
  label: string;
  description?: string;
  isPremium?: boolean;
}

function DraggableField({ type, label, description, isPremium }: DraggableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: type,
    data: { type: 'field', fieldType: type },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        group cursor-grab active:cursor-grabbing p-3 rounded-lg border transition-all
        ${isDragging 
          ? 'opacity-50 scale-105 shadow-lg border-blue-400 bg-blue-50' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg text-slate-600 group-hover:text-blue-600 transition-colors
          ${isPremium ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-slate-100'}
        `}>
          {FIELD_ICONS[type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 truncate">
              {label}
            </span>
            {isPremium && (
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Pro
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced sidebar props
interface EnhancedSidebarProps {
  onAddField?: (type: FieldType) => void;
  onOpenTemplates?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function EnhancedSidebar({
  onAddField,
  onOpenTemplates,
  collapsed = false,
  onToggleCollapse
}: EnhancedSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['basic', 'input', 'selection'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Field categories with enhanced organization
  const fieldCategories = [
    {
      id: 'basic',
      name: 'Basic Fields',
      icon: <FormInput className="h-4 w-4" />,
      fields: ['text', 'email', 'tel', 'number', 'textarea'] as FieldType[]
    },
    {
      id: 'selection',
      name: 'Selection Fields',
      icon: <Target className="h-4 w-4" />,
      fields: ['select', 'radio', 'checkbox'] as FieldType[]
    },
    {
      id: 'datetime',
      name: 'Date & Time',
      icon: <Calendar className="h-4 w-4" />,
      fields: ['date', 'time', 'datetime-local'] as FieldType[]
    },
    {
      id: 'advanced',
      name: 'Advanced',
      icon: <Zap className="h-4 w-4" />,
      fields: ['file', 'range', 'color', 'rating', 'signature'] as FieldType[]
    },
    {
      id: 'logic',
      name: 'Logic & Data',
      icon: <Database className="h-4 w-4" />,
      fields: ['formula', 'conditional', 'dependent', 'lookup'] as FieldType[],
      isPremium: true
    },
    {
      id: 'layout',
      name: 'Layout',
      icon: <Layout className="h-4 w-4" />,
      fields: ['section-break', 'page-break', 'hidden'] as FieldType[]
    }
  ];

  // Field descriptions
  const fieldDescriptions: Record<FieldType, string> = {
    text: 'Single line text input',
    email: 'Email address with validation',
    tel: 'Phone number input',
    number: 'Numeric input with validation',
    textarea: 'Multi-line text area',
    select: 'Dropdown selection',
    radio: 'Single choice from options',
    checkbox: 'Multiple choice selection',
    date: 'Date picker input',
    time: 'Time selector',
    'datetime-local': 'Date and time picker',
    file: 'File upload field',
    range: 'Slider for numeric range',
    color: 'Color picker input',
    rating: 'Star rating input',
    signature: 'Digital signature pad',
    formula: 'Calculated field',
    conditional: 'Show/hide based on conditions',
    dependent: 'Depends on other fields',
    lookup: 'Lookup from database',
    'section-break': 'Visual section divider',
    'page-break': 'Multi-page form break',
    hidden: 'Hidden field for data',
    url: 'URL input with validation',
    password: 'Password input field'
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full p-2"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 p-2 space-y-2">
          {fieldCategories.slice(0, 4).map(category => (
            <Button
              key={category.id}
              variant="ghost"
              size="sm"
              className="w-full p-2 justify-center"
              title={category.name}
            >
              {category.icon}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Form Builder</h2>
            <p className="text-sm text-slate-500 mt-1">Drag fields to your form</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onOpenTemplates}
              >
                <Archive className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Code2 className="h-4 w-4 mr-2" />
                Import Form
              </Button>
            </CardContent>
          </Card>

          {/* Field Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-medium text-slate-700">Form Fields</h3>
            </div>
            
            {fieldCategories.map(category => (
              <Collapsible
                key={category.id}
                open={expandedCategories.has(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto"
                  >
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span className="text-sm font-medium">{category.name}</span>
                      {category.isPremium && (
                        <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          Pro
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      expandedCategories.has(category.id) ? 'rotate-90' : ''
                    }`} />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-2">
                    {category.fields.map(fieldType => (
                      <DraggableField
                        key={fieldType}
                        type={fieldType}
                        label={FIELD_TYPE_LABELS[fieldType]}
                        description={fieldDescriptions[fieldType]}
                        isPremium={category.isPremium}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          <Separator />

          {/* Styling & Customization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PaintBucket className="h-4 w-4 text-blue-500" />
                Customize
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs"
              >
                <Palette className="h-4 w-4 mr-2" />
                Themes & Styling
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs"
              >
                <Settings className="h-4 w-4 mr-2" />
                Form Settings
              </Button>
            </CardContent>
          </Card>

          {/* Pro Features Callout */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Unlock Pro Features</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Get access to conditional logic, advanced validation, and premium integrations.
                  </p>
                  <Button size="sm" className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500">
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}