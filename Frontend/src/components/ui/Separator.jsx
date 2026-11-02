import { cn } from '../../lib/utils';

const Separator = ({ orientation = 'horizontal', className, ...props }) => {
  return (
    <div
      className={cn(
        'shrink-0 bg-gray-800',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
};

export default Separator;
