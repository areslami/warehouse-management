export const convertFormNumberFields = (data: any, fields: string[]) => {
  const converted = { ...data };
  
  fields.forEach(field => {
    if (converted[field] !== undefined && converted[field] !== null) {
      const value = String(converted[field]);
      const convertedValue = value.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
      converted[field] = parseFloat(convertedValue) || 0;
    }
  });
  
  return converted;
};

export const convertNestedFormFields = (data: any, nestedField: string, fields: string[]) => {
  const converted = { ...data };
  
  if (converted[nestedField] && Array.isArray(converted[nestedField])) {
    converted[nestedField] = converted[nestedField].map((item: any) => 
      convertFormNumberFields(item, fields)
    );
  }
  
  return converted;
};