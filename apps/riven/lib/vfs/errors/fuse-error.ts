import type Fuse from "@zkochan/fuse-native";

type FuseErrorCode =
  | typeof Fuse.EPERM
  | typeof Fuse.ENOENT
  | typeof Fuse.ESRCH
  | typeof Fuse.EINTR
  | typeof Fuse.EIO
  | typeof Fuse.ENXIO
  | typeof Fuse.E2BIG
  | typeof Fuse.ENOEXEC
  | typeof Fuse.EBADF
  | typeof Fuse.ECHILD
  | typeof Fuse.EAGAIN
  | typeof Fuse.ENOMEM
  | typeof Fuse.EACCES
  | typeof Fuse.EFAULT
  | typeof Fuse.ENOTBLK
  | typeof Fuse.EBUSY
  | typeof Fuse.EEXIST
  | typeof Fuse.EXDEV
  | typeof Fuse.ENODEV
  | typeof Fuse.ENOTDIR
  | typeof Fuse.EISDIR
  | typeof Fuse.EINVAL
  | typeof Fuse.ENFILE
  | typeof Fuse.EMFILE
  | typeof Fuse.ENOTTY
  | typeof Fuse.ETXTBSY
  | typeof Fuse.EFBIG
  | typeof Fuse.ENOSPC
  | typeof Fuse.ESPIPE
  | typeof Fuse.EROFS
  | typeof Fuse.EMLINK
  | typeof Fuse.EPIPE
  | typeof Fuse.EDOM
  | typeof Fuse.ERANGE
  | typeof Fuse.EDEADLK
  | typeof Fuse.ENAMETOOLONG
  | typeof Fuse.ENOLCK
  | typeof Fuse.ENOSYS
  | typeof Fuse.ENOTEMPTY
  | typeof Fuse.ELOOP
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
  | typeof Fuse.EWOULDBLOCK // Duplicate of EAGAIN
  | typeof Fuse.ENOMSG
  | typeof Fuse.EIDRM
  | typeof Fuse.ECHRNG
  | typeof Fuse.EL2NSYNC
  | typeof Fuse.EL3HLT
  | typeof Fuse.EL3RST
  | typeof Fuse.ELNRNG
  | typeof Fuse.EUNATCH
  | typeof Fuse.ENOCSI
  | typeof Fuse.EL2HLT
  | typeof Fuse.EBADE
  | typeof Fuse.EBADR
  | typeof Fuse.EXFULL
  | typeof Fuse.ENOANO
  | typeof Fuse.EBADRQC
  | typeof Fuse.EBADSLT
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
  | typeof Fuse.EDEADLOCK // Duplicate of EDEADLK
  | typeof Fuse.EBFONT
  | typeof Fuse.ENOSTR
  | typeof Fuse.ENODATA
  | typeof Fuse.ETIME
  | typeof Fuse.ENOSR
  | typeof Fuse.ENONET
  | typeof Fuse.ENOPKG
  | typeof Fuse.EREMOTE
  | typeof Fuse.ENOLINK
  | typeof Fuse.EADV
  | typeof Fuse.ESRMNT
  | typeof Fuse.ECOMM
  | typeof Fuse.EPROTO
  | typeof Fuse.EMULTIHOP
  | typeof Fuse.EDOTDOT
  | typeof Fuse.EBADMSG
  | typeof Fuse.EOVERFLOW
  | typeof Fuse.ENOTUNIQ
  | typeof Fuse.EBADFD
  | typeof Fuse.EREMCHG
  | typeof Fuse.ELIBACC
  | typeof Fuse.ELIBBAD
  | typeof Fuse.ELIBSCN
  | typeof Fuse.ELIBMAX
  | typeof Fuse.ELIBEXEC
  | typeof Fuse.EILSEQ
  | typeof Fuse.ERESTART
  | typeof Fuse.ESTRPIPE
  | typeof Fuse.EUSERS
  | typeof Fuse.ENOTSOCK
  | typeof Fuse.EDESTADDRREQ
  | typeof Fuse.EMSGSIZE
  | typeof Fuse.EPROTOTYPE
  | typeof Fuse.ENOPROTOOPT
  | typeof Fuse.EPROTONOSUPPORT
  | typeof Fuse.ESOCKTNOSUPPORT
  | typeof Fuse.EOPNOTSUPP
  | typeof Fuse.EPFNOSUPPORT
  | typeof Fuse.EAFNOSUPPORT
  | typeof Fuse.EADDRINUSE
  | typeof Fuse.EADDRNOTAVAIL
  | typeof Fuse.ENETDOWN
  | typeof Fuse.ENETUNREACH
  | typeof Fuse.ENETRESET
  | typeof Fuse.ECONNABORTED
  | typeof Fuse.ECONNRESET
  | typeof Fuse.ENOBUFS
  | typeof Fuse.EISCONN
  | typeof Fuse.ENOTCONN
  | typeof Fuse.ESHUTDOWN
  | typeof Fuse.ETOOMANYREFS
  | typeof Fuse.ETIMEDOUT
  | typeof Fuse.ECONNREFUSED
  | typeof Fuse.EHOSTDOWN
  | typeof Fuse.EHOSTUNREACH
  | typeof Fuse.EALREADY
  | typeof Fuse.EINPROGRESS
  | typeof Fuse.ESTALE
  | typeof Fuse.EUCLEAN
  | typeof Fuse.ENOTNAM
  | typeof Fuse.ENAVAIL
  | typeof Fuse.EISNAM
  | typeof Fuse.EREMOTEIO
  | typeof Fuse.EDQUOT
  | typeof Fuse.ENOMEDIUM
  | typeof Fuse.EMEDIUMTYPE;

export class FuseError extends Error {
  errorCode: FuseErrorCode;

  constructor(errorCode: FuseErrorCode, message: string) {
    super(message);

    this.errorCode = errorCode;
  }
}

export function isFuseError(error: unknown): error is FuseError {
  return error instanceof FuseError;
}
