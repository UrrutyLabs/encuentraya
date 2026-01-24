import { injectable } from "tsyringe";
import { prisma, $Enums } from "@infra/db/prisma";

/**
 * ProPayoutProfile entity (plain object)
 */
export interface ProPayoutProfileEntity {
  id: string;
  proProfileId: string;
  payoutMethod: "BANK_TRANSFER";
  fullName: string | null;
  documentId: string | null;
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  currency: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProPayoutProfile update input
 */
export interface ProPayoutProfileUpdateInput {
  payoutMethod?: "BANK_TRANSFER";
  fullName?: string | null;
  documentId?: string | null;
  bankName?: string | null;
  bankAccountType?: string | null;
  bankAccountNumber?: string | null;
  currency?: string;
  isComplete?: boolean;
}

/**
 * ProPayoutProfile repository interface
 * Handles all data access for pro payout profiles
 */
export interface ProPayoutProfileRepository {
  findByProProfileId(
    proProfileId: string
  ): Promise<ProPayoutProfileEntity | null>;
  upsertForProProfile(
    proProfileId: string,
    patch: ProPayoutProfileUpdateInput
  ): Promise<ProPayoutProfileEntity>;
  markCompleteIfValid(
    proProfileId: string
  ): Promise<ProPayoutProfileEntity | null>;
}

/**
 * ProPayoutProfile repository implementation using Prisma
 */
@injectable()
export class ProPayoutProfileRepositoryImpl implements ProPayoutProfileRepository {
  async findByProProfileId(
    proProfileId: string
  ): Promise<ProPayoutProfileEntity | null> {
    const profile = await prisma.proPayoutProfile.findUnique({
      where: { proProfileId },
    });

    return profile ? this.mapPrismaToDomain(profile) : null;
  }

  async upsertForProProfile(
    proProfileId: string,
    patch: ProPayoutProfileUpdateInput
  ): Promise<ProPayoutProfileEntity> {
    const profile = await prisma.proPayoutProfile.upsert({
      where: { proProfileId },
      create: {
        proProfileId,
        payoutMethod: (patch.payoutMethod ||
          "BANK_TRANSFER") as $Enums.PayoutMethod,
        fullName: patch.fullName ?? null,
        documentId: patch.documentId ?? null,
        bankName: patch.bankName ?? null,
        bankAccountType: patch.bankAccountType ?? null,
        bankAccountNumber: patch.bankAccountNumber ?? null,
        currency: patch.currency || "UYU",
        isComplete: patch.isComplete ?? false,
      },
      update: {
        payoutMethod: patch.payoutMethod
          ? (patch.payoutMethod as $Enums.PayoutMethod)
          : undefined,
        fullName: patch.fullName !== undefined ? patch.fullName : undefined,
        documentId:
          patch.documentId !== undefined ? patch.documentId : undefined,
        bankName: patch.bankName !== undefined ? patch.bankName : undefined,
        bankAccountType:
          patch.bankAccountType !== undefined
            ? patch.bankAccountType
            : undefined,
        bankAccountNumber:
          patch.bankAccountNumber !== undefined
            ? patch.bankAccountNumber
            : undefined,
        currency: patch.currency !== undefined ? patch.currency : undefined,
        isComplete:
          patch.isComplete !== undefined ? patch.isComplete : undefined,
      },
    });

    return this.mapPrismaToDomain(profile);
  }

  async markCompleteIfValid(
    proProfileId: string
  ): Promise<ProPayoutProfileEntity | null> {
    const profile = await prisma.proPayoutProfile.findUnique({
      where: { proProfileId },
    });

    if (!profile) {
      return null;
    }

    // Validate that required fields are present
    const isValid =
      profile.fullName &&
      profile.bankName &&
      profile.bankAccountNumber &&
      profile.currency;

    if (!isValid) {
      return this.mapPrismaToDomain(profile);
    }

    // Mark as complete
    const updated = await prisma.proPayoutProfile.update({
      where: { proProfileId },
      data: { isComplete: true },
    });

    return this.mapPrismaToDomain(updated);
  }

  private mapPrismaToDomain(prismaProfile: {
    id: string;
    proProfileId: string;
    payoutMethod: string;
    fullName: string | null;
    documentId: string | null;
    bankName: string | null;
    bankAccountType: string | null;
    bankAccountNumber: string | null;
    currency: string;
    isComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ProPayoutProfileEntity {
    return {
      id: prismaProfile.id,
      proProfileId: prismaProfile.proProfileId,
      payoutMethod: prismaProfile.payoutMethod as "BANK_TRANSFER",
      fullName: prismaProfile.fullName,
      documentId: prismaProfile.documentId,
      bankName: prismaProfile.bankName,
      bankAccountType: prismaProfile.bankAccountType,
      bankAccountNumber: prismaProfile.bankAccountNumber,
      currency: prismaProfile.currency,
      isComplete: prismaProfile.isComplete,
      createdAt: prismaProfile.createdAt,
      updatedAt: prismaProfile.updatedAt,
    };
  }
}
