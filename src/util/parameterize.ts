const encodeTokens = ['&', '?', '#']
const encodeTokensMatch = new RegExp(`[\\${encodeTokens.join('\\')}]`)
const encodeTokenMapping = encodeTokens.map(token => {
  return [new RegExp(`\\${token}`, 'g'), encodeURIComponent(token)]
})

const encodeParameter = (value: string): string => {
  let newValue: string = `${value}`
  if (newValue.match(encodeTokensMatch)) {
    encodeTokenMapping.forEach(mapping => newValue = newValue.replace.apply(newValue, mapping))
  }
  return newValue
}

const parameterize = (obj: any, prefix?: string): string => {
  let str = []

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]

      if (value !== undefined && value !== null && value !== "") {
        if (prefix) {
          key = `${prefix}[${key}]`
        }

        if (Array.isArray(value)) {
          if (value.length > 0) {
            str.push(`${key}=${value.map(encodeParameter).join(",")}`)
          }
        } else if (typeof value === "object") {
          str.push(parameterize(value, key))
        } else {
          str.push(`${key}=${encodeParameter(value)}`)
        }
      }
    }
  }

  // remove blanks
  str = str.filter(p => {
    return !!p
  })

  return str.join("&")
}

export { parameterize as default }
