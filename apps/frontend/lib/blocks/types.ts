export interface EditFormProps<T> {
  initialValues: T;
  onSave: (values: T) => void;
  onClose: () => void;
  blockId: string;
  integration: {
    id: string;
    type: string;
    createdAt: string;
  } | null;
}
