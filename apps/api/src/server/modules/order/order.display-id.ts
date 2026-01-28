/**
 * DisplayId generation utilities for orders
 *
 * Generates user-friendly displayIds using base32 encoding
 * Format: O + base32(number) padded to 4 characters
 * Examples: O0002, O0009, O000A, O000H, O000J, O000Z, O0020
 * Capacity: 32^4 = 1,048,576 orders
 */

/**
 * Base32 character set (without confusing characters: 0, O, 1, I, L)
 * Characters: 2-9, A-H, J-K, M-Z (32 characters total)
 */
const BASE32_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate displayId from a sequence number using base32 encoding
 * Format: O + base32(number) padded to 4 characters
 * Examples: O0002, O0009, O000A, O000H, O000J, O000Z, O0020
 *
 * @param sequenceNumber - The sequential number (starting from 1)
 * @returns DisplayId in format OXXXX
 */
export function generateOrderDisplayId(sequenceNumber: number): string {
  if (sequenceNumber < 1) {
    throw new Error("Sequence number must be >= 1");
  }

  let num = sequenceNumber;
  let result = "";

  // Convert to base32
  while (num > 0) {
    result = BASE32_CHARS[num % 32] + result;
    num = Math.floor(num / 32);
  }

  // Pad to 4 characters and prefix with 'O'
  return "O" + result.padStart(4, "2"); // '2' is the first valid character
}

/**
 * Get the next displayId for an order
 * Finds the highest existing sequence number and generates the next one
 *
 * @returns Promise<string> - The next displayId to use
 */
export async function getNextOrderDisplayId(): Promise<string> {
  // Use dynamic import to avoid circular dependencies and ensure env vars are loaded
  const prismaModule = await import("@infra/db/prisma");
  const prisma = prismaModule.prisma;

  // Get the order with the highest displayId (ordered by displayId descending)
  // This allows us to find the highest sequence number
  const ordersWithDisplayId = await prisma.order.findMany({
    select: {
      displayId: true,
    },
    orderBy: {
      displayId: "desc",
    },
    take: 1,
  });

  let nextSequence = 1;

  if (ordersWithDisplayId.length > 0 && ordersWithDisplayId[0]?.displayId) {
    // Extract sequence number from existing displayId
    const displayId = ordersWithDisplayId[0].displayId;
    const base32Str = displayId.slice(1); // Remove 'O' prefix
    let num = 0;
    for (let i = 0; i < base32Str.length; i++) {
      const char = base32Str[i];
      if (!char) continue; // Skip if character is undefined
      const index = BASE32_CHARS.indexOf(char);
      if (index === -1) {
        // Invalid character, start from 1
        num = 0;
        break;
      }
      num = num * 32 + index;
    }
    nextSequence = num + 1;
  }

  // Generate displayId and check for collisions (shouldn't happen, but safety check)
  let displayId = generateOrderDisplayId(nextSequence);
  let attempts = 0;
  const maxAttempts = 100;

  while (await prisma.order.findUnique({ where: { displayId } })) {
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error(
        `Failed to generate unique displayId after ${maxAttempts} attempts`
      );
    }
    displayId = generateOrderDisplayId(nextSequence + attempts);
  }

  return displayId;
}
