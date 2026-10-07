import React, { useState } from 'react';
import { Dialog, Button, Badge } from '@shared/ui';
import { CHECKLIST_TEMPLATES } from '../model/checklistTemplates';
import { Sparkles } from 'lucide-react';
import styles from './ApplyTemplateModal.module.css';

export interface ApplyTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (templateId: string) => Promise<void> | void;
}

export const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({
  open,
  onOpenChange,
  onApply,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('flight');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(selectedTemplate);
      onOpenChange(false);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Apply Checklist Template"
      description="Quickly inject curated travel packs and essential packing checklists."
      maxWidth={520}
    >
      <div className={styles.container}>
        <div className={styles.templateList} role="radiogroup" aria-label="Checklist templates">
          {Object.entries(CHECKLIST_TEMPLATES).map(([key, template]) => {
            const isSelected = selectedTemplate === key;
            return (
              <div
                key={key}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                className={`${styles.templateCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => setSelectedTemplate(key)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') setSelectedTemplate(key);
                }}
              >
                <div className={styles.headerRow}>
                  <span className={styles.title}>{template.name}</span>
                  {isSelected && (
                    <Badge variant="active" withDot>
                      Selected
                    </Badge>
                  )}
                </div>
                <p className={styles.desc}>{template.description}</p>
                <div className={styles.previewList}>
                  {template.items.slice(0, 4).map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        background: 'var(--color-surface-container-low)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      • {item.title}
                    </span>
                  ))}
                  {template.items.length > 4 && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-primary)',
                        padding: '2px 4px',
                        fontWeight: 500,
                      }}
                    >
                      +{template.items.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            leftIcon={isApplying ? undefined : <Sparkles size={16} />}
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? 'Applying...' : 'Apply Template Items'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
