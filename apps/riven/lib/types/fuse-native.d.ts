// declare module "@zkochan/fuse-native" {
//   import { EventEmitter } from "events";

//   namespace Fuse {
//     // Error codes
//     const EPERM: -1;
//     const ENOENT: -2;
//     const ESRCH: -3;
//     const EINTR: -4;
//     const EIO: -5;
//     const ENXIO: -6;
//     const E2BIG: -7;
//     const ENOEXEC: -8;
//     const EBADF: -9;
//     const ECHILD: -10;
//     const EAGAIN: -11;
//     const ENOMEM: -12;
//     const EACCES: -13;
//     const EFAULT: -14;
//     const ENOTBLK: -15;
//     const EBUSY: -16;
//     const EEXIST: -17;
//     const EXDEV: -18;
//     const ENODEV: -19;
//     const ENOTDIR: -20;
//     const EISDIR: -21;
//     const EINVAL: -22;
//     const ENFILE: -23;
//     const EMFILE: -24;
//     const ENOTTY: -25;
//     const ETXTBSY: -26;
//     const EFBIG: -27;
//     const ENOSPC: -28;
//     const ESPIPE: -29;
//     const EROFS: -30;
//     const EMLINK: -31;
//     const EPIPE: -32;
//     const EDOM: -33;
//     const ERANGE: -34;
//     const EDEADLK: -35;
//     const ENAMETOOLONG: -36;
//     const ENOLCK: -37;
//     const ENOSYS: -38;
//     const ENOTEMPTY: -39;
//     const ELOOP: -40;
//     const EWOULDBLOCK: -11;
//     const ENOMSG: -42;
//     const EIDRM: -43;
//     const ECHRNG: -44;
//     const EL2NSYNC: -45;
//     const EL3HLT: -46;
//     const EL3RST: -47;
//     const ELNRNG: -48;
//     const EUNATCH: -49;
//     const ENOCSI: -50;
//     const EL2HLT: -51;
//     const EBADE: -52;
//     const EBADR: -53;
//     const EXFULL: -54;
//     const ENOANO: -55;
//     const EBADRQC: -56;
//     const EBADSLT: -57;
//     const EDEADLOCK: -35;
//     const EBFONT: -59;
//     const ENOSTR: -60;
//     const ENODATA: -61;
//     const ETIME: -62;
//     const ENOSR: -63;
//     const ENONET: -64;
//     const ENOPKG: -65;
//     const EREMOTE: -66;
//     const ENOLINK: -67;
//     const EADV: -68;
//     const ESRMNT: -69;
//     const ECOMM: -70;
//     const EPROTO: -71;
//     const EMULTIHOP: -72;
//     const EDOTDOT: -73;
//     const EBADMSG: -74;
//     const EOVERFLOW: -75;
//     const ENOTUNIQ: -76;
//     const EBADFD: -77;
//     const EREMCHG: -78;
//     const ELIBACC: -79;
//     const ELIBBAD: -80;
//     const ELIBSCN: -81;
//     const ELIBMAX: -82;
//     const ELIBEXEC: -83;
//     const EILSEQ: -84;
//     const ERESTART: -85;
//     const ESTRPIPE: -86;
//     const EUSERS: -87;
//     const ENOTSOCK: -88;
//     const EDESTADDRREQ: -89;
//     const EMSGSIZE: -90;
//     const EPROTOTYPE: -91;
//     const ENOPROTOOPT: -92;
//     const EPROTONOSUPPORT: -93;
//     const ESOCKTNOSUPPORT: -94;
//     const EOPNOTSUPP: -95;
//     const EPFNOSUPPORT: -96;
//     const EAFNOSUPPORT: -97;
//     const EADDRINUSE: -98;
//     const EADDRNOTAVAIL: -99;
//     const ENETDOWN: -100;
//     const ENETUNREACH: -101;
//     const ENETRESET: -102;
//     const ECONNABORTED: -103;
//     const ECONNRESET: -104;
//     const ENOBUFS: -105;
//     const EISCONN: -106;
//     const ENOTCONN: -107;
//     const ESHUTDOWN: -108;
//     const ETOOMANYREFS: -109;
//     const ETIMEDOUT: -110;
//     const ECONNREFUSED: -111;
//     const EHOSTDOWN: -112;
//     const EHOSTUNREACH: -113;
//     const EALREADY: -114;
//     const EINPROGRESS: -115;
//     const ESTALE: -116;
//     const EUCLEAN: -117;
//     const ENOTNAM: -118;
//     const ENAVAIL: -119;
//     const EISNAM: -120;
//     const EREMOTEIO: -121;
//     const EDQUOT: -122;
//     const ENOMEDIUM: -123;
//     const EMEDIUMTYPE: -124;

//     // Static methods
//     function unmount(mnt: string, callback: (err: Error | null) => void): void;
//     function beforeMount(callback: (err: Error | null) => void): void;
//     function beforeUnmount(callback: (err: Error | null) => void): void;
//     function configure(callback: (err: Error | null) => void): void;
//     function unconfigure(callback: (err: Error | null) => void): void;
//     function isConfigured(
//       callback: (err: Error | null, configured?: boolean) => void,
//     ): void;

//     // Stat object for getattr/fgetattr
//     interface Stats {
//       mtime: Date | number;
//       atime: Date | number;
//       ctime: Date | number;
//       size: number;
//       mode: number;
//       uid?: number;
//       gid?: number;
//       dev?: number;
//       nlink?: number;
//       ino?: number;
//       rdev?: number;
//       blksize?: number;
//       blocks?: number;
//     }

//     // Statfs object for statfs
//     interface StatFs {
//       bsize: number;
//       frsize: number;
//       blocks: number;
//       bfree: number;
//       bavail: number;
//       files: number;
//       ffree: number;
//       favail: number;
//       fsid: number;
//       flag: number;
//       namemax: number;
//     }

//     // FUSE operations handlers
//     interface Operations {
//       init?(callback: (err: number) => void): void;
//       error?(callback: (err: number) => void): void;
//       access?(
//         path: string,
//         mode: number,
//         callback: (err: number) => void,
//       ): void;
//       statfs?(
//         path: string,
//         callback: (err: number, statfs?: StatFs) => void,
//       ): void;
//       getattr?(
//         path: string,
//         callback: (err: number, stat?: Stats) => void,
//       ): void;
//       fgetattr?(
//         path: string,
//         fd: number,
//         callback: (err: number, stat?: Stats) => void,
//       ): void;
//       flush?(path: string, fd: number, callback: (err: number) => void): void;
//       fsync?(
//         path: string,
//         fd: number,
//         datasync: number,
//         callback: (err: number) => void,
//       ): void;
//       fsyncdir?(
//         path: string,
//         fd: number,
//         datasync: number,
//         callback: (err: number) => void,
//       ): void;
//       readdir?(
//         path: string,
//         callback: (err: number, names?: string[], stats?: Stats[]) => void,
//       ): void;
//       truncate?(
//         path: string,
//         size: number,
//         callback: (err: number) => void,
//       ): void;
//       ftruncate?(
//         path: string,
//         fd: number,
//         size: number,
//         callback: (err: number) => void,
//       ): void;
//       readlink?(
//         path: string,
//         callback: (err: number, linkname?: string) => void,
//       ): void;
//       chown?(
//         path: string,
//         uid: number,
//         gid: number,
//         callback: (err: number) => void,
//       ): void;
//       chmod?(path: string, mode: number, callback: (err: number) => void): void;
//       mknod?(
//         path: string,
//         mode: number,
//         dev: number,
//         callback: (err: number) => void,
//       ): void;
//       setxattr?(
//         path: string,
//         name: string,
//         value: Buffer,
//         position: number,
//         flags: number,
//         callback: (err: number) => void,
//       ): void;
//       getxattr?(
//         path: string,
//         name: string,
//         position: number,
//         callback: (err: number, value?: Buffer) => void,
//       ): void;
//       listxattr?(
//         path: string,
//         callback: (err: number, list?: string[]) => void,
//       ): void;
//       removexattr?(
//         path: string,
//         name: string,
//         callback: (err: number) => void,
//       ): void;
//       open?(
//         path: string,
//         flags: number,
//         callback: (err: number, fd?: number) => void,
//       ): void;
//       opendir?(
//         path: string,
//         flags: number,
//         callback: (err: number, fd?: number) => void,
//       ): void;
//       read?(
//         path: string,
//         fd: number,
//         buffer: Buffer,
//         length: number,
//         position: number,
//         callback: (err: number, bytesRead?: number) => void,
//       ): void;
//       write?(
//         path: string,
//         fd: number,
//         buffer: Buffer,
//         length: number,
//         position: number,
//         callback: (err: number, bytesWritten?: number) => void,
//       ): void;
//       release?(path: string, fd: number, callback: (err: number) => void): void;
//       releasedir?(
//         path: string,
//         fd: number,
//         callback: (err: number) => void,
//       ): void;
//       create?(
//         path: string,
//         mode: number,
//         callback: (err: number, fd?: number) => void,
//       ): void;
//       utimens?(
//         path: string,
//         atime: number,
//         mtime: number,
//         callback: (err: number) => void,
//       ): void;
//       unlink?(path: string, callback: (err: number) => void): void;
//       rename?(src: string, dest: string, callback: (err: number) => void): void;
//       link?(src: string, dest: string, callback: (err: number) => void): void;
//       symlink?(
//         src: string,
//         dest: string,
//         callback: (err: number) => void,
//       ): void;
//       mkdir?(path: string, mode: number, callback: (err: number) => void): void;
//       rmdir?(path: string, callback: (err: number) => void): void;
//     }

//     // Options for mounting
//     interface MountOptions {
//       displayFolder?: string;
//       debug?: boolean;
//       force?: boolean;
//       mkdir?: boolean;
//       timeout?:
//         | number
//         | false
//         | { [key: string]: number | false; default?: number };

//       // FUSE-specific options
//       allowOther?: boolean;
//       allowRoot?: boolean;
//       autoUnmount?: boolean;
//       defaultPermissions?: boolean;
//       blkdev?: boolean;
//       blksize?: number;
//       maxRead?: number;
//       fd?: number;
//       userId?: number;
//       fsname?: string;
//       subtype?: string;
//       kernelCache?: boolean;
//       autoCache?: boolean;
//       umask?: number;
//       uid?: number;
//       gid?: number;
//       entryTimeout?: number;
//       attrTimeout?: number;
//       acAttrTimeout?: number;
//       noforget?: boolean;
//       remember?: number;
//       modules?: string;
//     }
//   }

//   class Fuse extends EventEmitter {
//     constructor(
//       mnt: string,
//       handlers: Fuse.Operations,
//       opts?: Fuse.MountOptions,
//     );

//     // Instance methods
//     mount(callback: (err: Error | null) => void): void;
//     unmount(callback: (err: Error | null) => void): void;
//     errno(code: string): number;

//     // Static properties
//     static readonly EPERM: -1;
//     static readonly ENOENT: -2;
//     static readonly ESRCH: -3;
//     static readonly EINTR: -4;
//     static readonly EIO: -5;
//     static readonly ENXIO: -6;
//     static readonly E2BIG: -7;
//     static readonly ENOEXEC: -8;
//     static readonly EBADF: -9;
//     static readonly ECHILD: -10;
//     static readonly EAGAIN: -11;
//     static readonly ENOMEM: -12;
//     static readonly EACCES: -13;
//     static readonly EFAULT: -14;
//     static readonly ENOTBLK: -15;
//     static readonly EBUSY: -16;
//     static readonly EEXIST: -17;
//     static readonly EXDEV: -18;
//     static readonly ENODEV: -19;
//     static readonly ENOTDIR: -20;
//     static readonly EISDIR: -21;
//     static readonly EINVAL: -22;
//     static readonly ENFILE: -23;
//     static readonly EMFILE: -24;
//     static readonly ENOTTY: -25;
//     static readonly ETXTBSY: -26;
//     static readonly EFBIG: -27;
//     static readonly ENOSPC: -28;
//     static readonly ESPIPE: -29;
//     static readonly EROFS: -30;
//     static readonly EMLINK: -31;
//     static readonly EPIPE: -32;
//     static readonly EDOM: -33;
//     static readonly ERANGE: -34;
//     static readonly EDEADLK: -35;
//     static readonly ENAMETOOLONG: -36;
//     static readonly ENOLCK: -37;
//     static readonly ENOSYS: -38;
//     static readonly ENOTEMPTY: -39;
//     static readonly ELOOP: -40;
//     static readonly EWOULDBLOCK: -11;
//     static readonly ENOMSG: -42;
//     static readonly EIDRM: -43;
//     static readonly ECHRNG: -44;
//     static readonly EL2NSYNC: -45;
//     static readonly EL3HLT: -46;
//     static readonly EL3RST: -47;
//     static readonly ELNRNG: -48;
//     static readonly EUNATCH: -49;
//     static readonly ENOCSI: -50;
//     static readonly EL2HLT: -51;
//     static readonly EBADE: -52;
//     static readonly EBADR: -53;
//     static readonly EXFULL: -54;
//     static readonly ENOANO: -55;
//     static readonly EBADRQC: -56;
//     static readonly EBADSLT: -57;
//     static readonly EDEADLOCK: -35;
//     static readonly EBFONT: -59;
//     static readonly ENOSTR: -60;
//     static readonly ENODATA: -61;
//     static readonly ETIME: -62;
//     static readonly ENOSR: -63;
//     static readonly ENONET: -64;
//     static readonly ENOPKG: -65;
//     static readonly EREMOTE: -66;
//     static readonly ENOLINK: -67;
//     static readonly EADV: -68;
//     static readonly ESRMNT: -69;
//     static readonly ECOMM: -70;
//     static readonly EPROTO: -71;
//     static readonly EMULTIHOP: -72;
//     static readonly EDOTDOT: -73;
//     static readonly EBADMSG: -74;
//     static readonly EOVERFLOW: -75;
//     static readonly ENOTUNIQ: -76;
//     static readonly EBADFD: -77;
//     static readonly EREMCHG: -78;
//     static readonly ELIBACC: -79;
//     static readonly ELIBBAD: -80;
//     static readonly ELIBSCN: -81;
//     static readonly ELIBMAX: -82;
//     static readonly ELIBEXEC: -83;
//     static readonly EILSEQ: -84;
//     static readonly ERESTART: -85;
//     static readonly ESTRPIPE: -86;
//     static readonly EUSERS: -87;
//     static readonly ENOTSOCK: -88;
//     static readonly EDESTADDRREQ: -89;
//     static readonly EMSGSIZE: -90;
//     static readonly EPROTOTYPE: -91;
//     static readonly ENOPROTOOPT: -92;
//     static readonly EPROTONOSUPPORT: -93;
//     static readonly ESOCKTNOSUPPORT: -94;
//     static readonly EOPNOTSUPP: -95;
//     static readonly EPFNOSUPPORT: -96;
//     static readonly EAFNOSUPPORT: -97;
//     static readonly EADDRINUSE: -98;
//     static readonly EADDRNOTAVAIL: -99;
//     static readonly ENETDOWN: -100;
//     static readonly ENETUNREACH: -101;
//     static readonly ENETRESET: -102;
//     static readonly ECONNABORTED: -103;
//     static readonly ECONNRESET: -104;
//     static readonly ENOBUFS: -105;
//     static readonly EISCONN: -106;
//     static readonly ENOTCONN: -107;
//     static readonly ESHUTDOWN: -108;
//     static readonly ETOOMANYREFS: -109;
//     static readonly ETIMEDOUT: -110;
//     static readonly ECONNREFUSED: -111;
//     static readonly EHOSTDOWN: -112;
//     static readonly EHOSTUNREACH: -113;
//     static readonly EALREADY: -114;
//     static readonly EINPROGRESS: -115;
//     static readonly ESTALE: -116;
//     static readonly EUCLEAN: -117;
//     static readonly ENOTNAM: -118;
//     static readonly ENAVAIL: -119;
//     static readonly EISNAM: -120;
//     static readonly EREMOTEIO: -121;
//     static readonly EDQUOT: -122;
//     static readonly ENOMEDIUM: -123;
//     static readonly EMEDIUMTYPE: -124;

//     // Static methods
//     static unmount(mnt: string, callback: (err: Error | null) => void): void;
//     static beforeMount(callback: (err: Error | null) => void): void;
//     static beforeUnmount(callback: (err: Error | null) => void): void;
//     static configure(callback: (err: Error | null) => void): void;
//     static unconfigure(callback: (err: Error | null) => void): void;
//     static isConfigured(
//       callback: (err: Error | null, configured?: boolean) => void,
//     ): void;
//   }

//   export = Fuse;
// }
