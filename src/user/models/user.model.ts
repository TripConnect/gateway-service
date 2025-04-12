
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

    static fromUserInfo(userInfo: UserInfo.AsObject): User {
        let user = new User();
        user.id = userInfo.id;
        user.displayName = userInfo.displayName;
        user.avatar = userInfo.avatar;
        user.enabledTwofa = userInfo.enabledTwofa;
        return user;
    }
}
