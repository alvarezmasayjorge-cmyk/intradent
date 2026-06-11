-- AlterTable
ALTER TABLE "Cita" ALTER COLUMN "estado" SET DEFAULT 'agendada';

-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "foto" TEXT;
