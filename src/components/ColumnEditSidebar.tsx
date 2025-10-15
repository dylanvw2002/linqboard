import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, Crop } from "lucide-react";
import { getGlowStyles, getGlowTypeLabel, GlowType } from "@/lib/glowStyles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnType, getColumnTypeOptions } from "@/lib/columnTypes";
import { useTranslation } from "react-i18next";
interface Column {
  id: string;
  name: string;
  position: number;
  width_ratio: number;
  board_id: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  header_height: number;
  header_width?: number;
  content_padding_top: number;
  content_padding_right: number;
  content_padding_bottom: number;
  content_padding_left: number;
  glow_type?: GlowType;
  column_type?: ColumnType;
}
interface ColumnEditSidebarProps {
  column: Column;
  onClose: () => void;
  onSave: () => void;
}
export const ColumnEditSidebar = ({
  column,
  onClose,
  onSave
}: ColumnEditSidebarProps) => {
  const { t } = useTranslation();
  const [editedColumn, setEditedColumn] = useState(column);
  const handleSave = async () => {
    try {
      const {
        error
      } = await supabase.from('columns').update({
        name: editedColumn.name,
        x_position: editedColumn.x_position,
        y_position: editedColumn.y_position,
        width: editedColumn.width,
        height: editedColumn.height,
        header_height: editedColumn.header_height,
        header_width: editedColumn.header_width,
        content_padding_top: editedColumn.content_padding_top,
        content_padding_right: editedColumn.content_padding_right,
        content_padding_bottom: editedColumn.content_padding_bottom,
        content_padding_left: editedColumn.content_padding_left,
        column_type: editedColumn.column_type || 'regular',
        glow_type: editedColumn.glow_type || 'default'
      }).eq('id', editedColumn.id);
      if (error) throw error;
      toast.success(t('board.columnSaved'));
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(t('board.saveError') + error.message);
    }
  };
  return <div className="fixed right-0 top-0 h-full w-80 bg-background shadow-2xl z-[100] overflow-y-auto border-l">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{t('board.editColumn')}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="column-name">{t('column.name')}</Label>
            <Input id="column-name" value={editedColumn.name} onChange={e => setEditedColumn({
            ...editedColumn,
            name: e.target.value
          })} placeholder={t('column.namePlaceholder')} />
          </div>

          <div>
            <Label htmlFor="column-type">{t('column.type')}</Label>
            <Select value={editedColumn.column_type || 'regular'} onValueChange={(value: ColumnType) => setEditedColumn({
            ...editedColumn,
            column_type: value
          })}>
              <SelectTrigger id="column-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getColumnTypeOptions().map(option => <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="glow-type">{t('column.glowEffect')}</Label>
            <Select value={editedColumn.glow_type || 'default'} onValueChange={(value: GlowType) => setEditedColumn({
            ...editedColumn,
            glow_type: value
          })}>
              <SelectTrigger id="glow-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['default', 'red', 'green', 'blue', 'yellow', 'purple', 'orange'] as GlowType[]).map(type => <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border ${getGlowStyles(type).header.split(' ')[0]}`} />
                      {getGlowTypeLabel(type)}
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="x-position">{t('column.xPosition')}: {editedColumn.x_position}px</Label>
            <Input id="x-position" type="number" value={editedColumn.x_position} onChange={e => setEditedColumn({
            ...editedColumn,
            x_position: parseInt(e.target.value) || 0
          })} min={0} />
          </div>

          <div>
            <Label htmlFor="y-position">{t('column.yPosition')}: {editedColumn.y_position}px</Label>
            <Input id="y-position" type="number" value={editedColumn.y_position} onChange={e => setEditedColumn({
            ...editedColumn,
            y_position: parseInt(e.target.value) || 0
          })} min={0} />
          </div>

          <div>
            <Label>{t('common.width')}: {editedColumn.width}px</Label>
            <Slider value={[editedColumn.width]} onValueChange={value => setEditedColumn({
            ...editedColumn,
            width: value[0]
          })} min={200} max={600} step={10} className="mt-2" />
          </div>

          <div>
            <Label>{t('common.height')}: {editedColumn.height}px</Label>
            <Slider value={[editedColumn.height]} onValueChange={value => setEditedColumn({
            ...editedColumn,
            height: value[0]
          })} min={400} max={1000} step={50} className="mt-2" />
          </div>
        </div>

        {/* Header & Content Crop Section */}
        <div className="space-y-4 pt-6 border-t">
          <h4 className="font-semibold flex items-center gap-2">
            <Crop className="h-4 w-4" />
            {t('column.headerAndTaskArea')}
          </h4>

          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              💡 <strong>{t('column.tip')}:</strong> {t('column.resizeInstructions')}
            </p>
            <p className="text-xs text-muted-foreground">
              • {t('column.dragCornersEdges')}<br />
              • {t('column.holdAlt')}
            </p>
          </div>

          <div>
            <Label>{t('column.headerHeight')}: {editedColumn.header_height || 60}px</Label>
            <Slider value={[editedColumn.header_height || 60]} onValueChange={value => setEditedColumn({
            ...editedColumn,
            header_height: value[0]
          })} min={40} max={200} step={5} className="mt-2" />
          </div>

          <div>
            <Label>{t('column.headerWidth')}: {editedColumn.header_width ? `${editedColumn.header_width}px` : t('column.fullWidth')}</Label>
            <Slider value={[editedColumn.header_width || editedColumn.width]} onValueChange={value => setEditedColumn({
            ...editedColumn,
            header_width: value[0]
          })} min={100} max={600} step={10} className="mt-2" />
            <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={() => setEditedColumn({
            ...editedColumn,
            header_width: undefined
          })}>
              {t('column.resetToFullWidth')}
            </Button>
          </div>

          
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            {t('common.save')}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>;
};