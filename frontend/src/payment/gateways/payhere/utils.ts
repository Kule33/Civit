export function submitPayHereForm(fields: Record<string, string>, checkoutUrl: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value ?? "";
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
