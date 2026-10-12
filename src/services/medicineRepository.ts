import database from '@/data/db.json';
import type { Medicine } from '@/types/medicine';

const DELAY_MS = 350;
const medicines = database.drugs as Medicine[];

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, DELAY_MS));

export async function getMedicines(): Promise<Medicine[]> {
  await wait();
  return medicines;
}

export async function getMedicineById(id: string): Promise<Medicine | undefined> {
  await wait();
  return medicines.find((medicine) => medicine.id === id);
}
