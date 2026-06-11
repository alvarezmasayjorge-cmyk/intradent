-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'doctor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AlterTable Paciente
ALTER TABLE "Paciente" ADD COLUMN "doctorId" INTEGER;

-- AlterTable Cita
ALTER TABLE "Cita" ADD COLUMN "doctorId" INTEGER,
ADD COLUMN "duracion" INTEGER NOT NULL DEFAULT 30;

-- Update existing estado values
UPDATE "Cita" SET "estado" = 'agendada' WHERE "estado" = 'pendiente';

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
