import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FIELD_TYPE_CATEGORIES, FIELD_TYPE_LABELS, FieldType } from '@/types/formField';

interface AddFieldMenuProps {
  onAdd: (type: FieldType) => void;
}

export function AddFieldMenu({ onAdd }: AddFieldMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {Object.entries(FIELD_TYPE_CATEGORIES).map(([category, types], i) => (
          <div key={category}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs">{category}</DropdownMenuLabel>
            <DropdownMenuGroup>
              {types.map(type => (
                <DropdownMenuItem key={type} onClick={() => onAdd(type)}>
                  {FIELD_TYPE_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
