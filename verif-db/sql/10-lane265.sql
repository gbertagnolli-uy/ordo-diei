-- AlterTable
ALTER TABLE "Checklist_Items" ADD COLUMN     "Completado_En" TIMESTAMP(3),
ADD COLUMN     "Completado_Por_ID" INTEGER;

-- AddForeignKey
ALTER TABLE "Checklist_Items" ADD CONSTRAINT "Checklist_Items_Completado_Por_ID_fkey" FOREIGN KEY ("Completado_Por_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

