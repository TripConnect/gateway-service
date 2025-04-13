
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserInfo } from 'common-utils/protos/defs/user_service_pb';

@ObjectType()
export class User {

    @Field(type => ID)
    id: string;

    @Field()
    displayName: string;

    @Field({ nullable: true })
    avatar: string;

    @Field()
    enabledTwofa: boolean;

    static fromGrpcUserInfo(message?: UserInfo): User {
        if (!message) {
            return new User();
        }

        let user = new User();
        user.id = message.getId();
        user.displayName = message.getDisplayName();
        user.avatar = message.getAvatar();
        user.enabledTwofa = message.getEnabledTwofa();
        return user;
    }
}
