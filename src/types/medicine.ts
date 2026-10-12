export interface Medicine {
  id: string;
  name: string;
  latin_name: string;
  active_substance: string;
  category: string;
  form: string;
  dosage: string;
  manufacturer: string;
  prescription_required: boolean;
  description: string;
  stock: number;
}

export interface SelectionLine {
  medicine: Medicine;
  quantity: number;
}
