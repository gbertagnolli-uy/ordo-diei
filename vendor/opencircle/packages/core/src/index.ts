export { AccountRouter as AccountService } from "./services/routers/account";
// Export additional types
export type { InstallationStatus } from "./services/routers/appsettings";
export { AuthRouter as AuthService } from "./services/routers/auth";
export { ChannelsRouter as ChannelsService } from "./services/routers/channels";
export { CoursesRouter as CoursesService } from "./services/routers/courses";
export { MediaRouter as MediaService } from "./services/routers/media";
export { PostsRouter as PostService } from "./services/routers/posts";
export { UsersRouter as UserService } from "./services/routers/users";
export * from "./services/types";
export { Api, createApi } from "./utils/api";
export { ApiClient } from "./utils/apiClient";
