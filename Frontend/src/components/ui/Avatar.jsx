import { cn } from '../../lib/utils';

export const Avatar = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const AvatarImage = ({ src, alt, className, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
};

export const AvatarFallback = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
