import { GraphQLError } from "graphql";
import { StatusCode } from "utils/graphql";

export function AuthenticatedRequest(resolver: (...args: any[]) => Promise<any>) {
    return async function (...args: any[]) {
        const [_, params, context] = args;
        const { currentUserId } = context;

        if (!currentUserId) {
            throw new GraphQLError("Unauthorized", {
                extensions: {
                    code: StatusCode.UNAUTHORIZED,
                },
            });
        }

        return await resolver(...args);
    };
}
