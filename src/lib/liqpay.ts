// LiqPay's checkout is a plain browser redirect: a form POSTing
// data+signature to their hosted page. There's no JS SDK involved and no
// card details ever touch our frontend — building and submitting a
// throwaway form is the whole integration.
export function redirectToLiqPayCheckout(url: string, data: string, signature: string) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  form.style.display = 'none'

  for (const [name, value] of [
    ['data', data],
    ['signature', signature],
  ]) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}
