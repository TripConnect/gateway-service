import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { User } from 'src/user/models/graphql.model';
import { Message } from 'src/chat/models/graphql.model';
import { UserService } from 'src/user/user.service';
import { FindUserRequest } from 'node-proto-lib/protos/user_service_pb';

@Resolver(() => Message)
export class MessageResolver {
  constructor(private readonly userService: UserService) {}

  @ResolveField(() => User)
  async fromUser(@Parent() message: Message): Promise<User> {
    const req = new FindUserRequest().setUserId(message.fromUser.id);
    return await this.userService.findUser(req);
  }
}
