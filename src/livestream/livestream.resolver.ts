import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { GatewayContext } from '../app.module';
import { Livestream } from './models/graphql.model';
import { LivestreamService } from './livestream.service';
import {
  FindLivestreamRequest,
  SearchLivestreamsRequest,
} from 'node-proto-lib/protos/livestream_service_pb';

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
    @Args('searchTerm', {
      type: () => String,
      nullable: true,
      defaultValue: '',
    })
    searchTerm: string,
    @Args('status', {
      type: () => String,
      nullable: true,
      defaultValue: '',
    })
    status: string,
    @Args('pageNumber', { type: () => Int })
    pageNumber: number,
    @Args('pageSize', { type: () => Int })
    pageSize: number,
  ): Promise<Livestream[]> {
    const req = new SearchLivestreamsRequest()
      .setStatus(status)
      .setTerm(searchTerm)
      .setPageNumber(pageNumber)
      .setPageSize(pageSize);
    return await this.livestreamService.searchLivestream(req);
  }

  @Query(() => Livestream)
  async livestream(
    @Args('id', { type: () => ID })
    id: string,
  ): Promise<Livestream> {
    const req = new FindLivestreamRequest().setLivestreamId(id);
    return await this.livestreamService.findLivestream(req);
  }
}
