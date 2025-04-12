
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserInfo } from 'common-utils/protos/defs/user_service_pb';

@ObjectType()
export class User {

    @Field(type => ID)
    id: String;

    @Field()
    displayName: string;

    @Field({ nullable: true })
    avatar: string;

    @Field()
    enabledTwofa: boolean;

    static fromUserInfo(userInfo: UserInfo): User {
        let user = new User();
        user.id = userInfo.getId();
        user.displayName = userInfo.getDisplayName();
        user.avatar = userInfo.getAvatar();
        user.enabledTwofa = userInfo.getEnabledTwofa();
        return user;
    }
}
