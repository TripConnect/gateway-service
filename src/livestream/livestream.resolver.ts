import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GatewayContext } from '../app.module';
import { Livestream } from './models/graphql.model';
import { LivestreamService } from './livestream.service';

@Resolver()
export class LivestreamResolver {
  constructor(private readonly livestreamService: LivestreamService) {}

  // @UseGuards(GqlAuthGuard)
  @Mutation(() => Livestream)
  createLivestream(@Context() context: GatewayContext): Livestream {
    const fakeId = crypto.randomUUID();
    return new Livestream({
      id: fakeId,
      createdBy: context.currentUserId?.toString(),
      hlsLink: `/livestreams/${fakeId}/index.m3u8`,
    });
  }

  // @UseGuards(GqlAuthGuard)
  @Query(() => [Livestream])
  async livestreams(
    @Args('pageNumber', { type: () => Int, defaultValue: 0 })
    pageNumber: number,
    @Args('pageSize', { type: () => Int, defaultValue: 20 })
    pageSize: number,
  ): Promise<Livestream[]> {
    return await this.livestreamService.getActiveLivestreams();
  }
}
