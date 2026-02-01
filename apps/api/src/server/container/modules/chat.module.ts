import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import { ChatRepository, ChatRepositoryImpl } from "@modules/chat/chat.repo";
import { ChatService } from "@modules/chat/chat.service";

/**
 * Register Chat module dependencies
 * Depends on: OrderRepository, ProRepository
 */
export function registerChatModule(container: DependencyContainer): void {
  container.register<ChatRepository>(TOKENS.ChatRepository, {
    useClass: ChatRepositoryImpl,
  });

  container.register<ChatService>(TOKENS.ChatService, {
    useClass: ChatService,
  });
}
