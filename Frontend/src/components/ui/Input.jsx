const Input = ({ label, error, icon: Icon, ...props }) => {
  return (
    <div>
      {label && <label>{label}</label>}
      <div>
        {Icon && <span><Icon /></span>}
        <input {...props} />
      </div>
      {error && <p>{error}</p>}
    </div>
  );
};

export default Input;
