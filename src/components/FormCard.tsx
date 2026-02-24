import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileCode,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  CheckSquare,
  Square,
  ExternalLink,
  Webhook,
  BarChart3,
  Sheet,
  Layers,
} from 'lucide-react';
import { FormConfig } from '@/types/formField';

interface FormCardProps {
  form: FormConfig;
  isActive: boolean;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onToggleSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function FormCard({
  form,
  isActive,
  isSelected,
  viewMode,
  onSelect,
  onToggleSelect,
  onCopy,
  onDelete,
}: FormCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getFormStats = () => ({
    fields: form.fields.length,
    integrations: [
      form.webhookConfig?.enabled && 'Webhook',
      form.googleSheetsConfig?.enabled && 'Sheets',
      (form.pixelConfig?.snapPixelId || form.pixelConfig?.metaPixelId || form.pixelConfig?.googleAdsId) && 'Pixels'
    ].filter(Boolean).length,
    isDeployed: !!form.deployedUrl
  });

  const stats = getFormStats();

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className={`group flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
          isActive
            ? 'bg-primary/5 border-primary/20 shadow-sm'
            : 'bg-background border-border hover:border-border/80'
        }`}
      >
        <div onClick={handleCheckboxClick} className="flex-shrink-0">
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
        
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isActive ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <FileCode className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-sm truncate ${
              isActive ? 'text-primary' : 'text-foreground'
            }`}>
              {form.title}
            </h3>
            {stats.isDeployed && (
              <div className="flex-shrink-0">
                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 bg-green-50">
                  <div className="w-1 h-1 rounded-full bg-green-500 mr-1" />
                  Live
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {stats.fields} fields
            </span>
            {stats.integrations > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.integrations} integrations
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(form.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {form.webhookConfig?.enabled && (
              <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary/70 px-1.5 py-0.5">
                <Webhook className="h-2 w-2" />
              </Badge>
            )}
            {form.googleSheetsConfig?.enabled && (
              <Badge variant="outline" className="text-[9px] gap-1 border-green-400/30 text-green-600 px-1.5 py-0.5">
                <Sheet className="h-2 w-2" />
              </Badge>
            )}
            {(form.pixelConfig?.snapPixelId || form.pixelConfig?.metaPixelId || form.pixelConfig?.googleAdsId) && (
              <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary/70 px-1.5 py-0.5">
                <BarChart3 className="h-2 w-2" />
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {form.deployedUrl && (
                <>
                  <DropdownMenuItem asChild>
                    <a href={form.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live Form
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <Card 
      onClick={handleCardClick}
      className={`group cursor-pointer transition-all hover:shadow-md ${
        isActive
          ? 'ring-2 ring-primary/20 border-primary/20 shadow-sm'
          : 'hover:border-border/80'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div onClick={handleCheckboxClick} className="flex-shrink-0 mt-1">
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {form.deployedUrl && (
                <>
                  <DropdownMenuItem asChild>
                    <a href={form.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live Form
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
          isActive ? 'bg-primary/10' : 'bg-muted'
        }`}>
          <FileCode className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm truncate ${
              isActive ? 'text-primary' : 'text-foreground'
            }`}>
              {form.title}
            </h3>
            {stats.isDeployed && (
              <div className="flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500" title="Live" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {stats.fields}
            </span>
            {stats.integrations > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.integrations}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {form.webhookConfig?.enabled && (
              <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70 px-1.5 py-0.5">
                <Webhook className="h-2 w-2" />
              </Badge>
            )}
            {form.googleSheetsConfig?.enabled && (
              <Badge variant="outline" className="text-[9px] border-green-400/30 text-green-600 px-1.5 py-0.5">
                <Sheet className="h-2 w-2" />
              </Badge>
            )}
            {(form.pixelConfig?.snapPixelId || form.pixelConfig?.metaPixelId || form.pixelConfig?.googleAdsId) && (
              <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70 px-1.5 py-0.5">
                <BarChart3 className="h-2 w-2" />
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Updated {formatDate(form.updatedAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}