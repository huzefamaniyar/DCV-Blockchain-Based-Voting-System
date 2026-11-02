const Badge = ({ children, ...props }) => {
  return (
    <span {...props}>{children}</span>
  );
};

export default Badge;
