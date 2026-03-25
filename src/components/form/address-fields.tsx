import { useState, useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { countries } from "@/data/countries"
import { provinces as provinceList } from "@/data/wilayah/provinces"
import { loadProvinceData, type WilayahEntry } from "@/data/wilayah"

interface AddressValues {
  city: string
  state: string
  postalCode: string
  country: string
}

interface AddressFieldsProps {
  values: AddressValues
  onChange: (field: keyof AddressValues, value: string) => void
  stateLabel?: string
  cityPlaceholder?: string
  statePlaceholder?: string
}

export function AddressFields({
  values,
  onChange,
  stateLabel = "State/Region",
  cityPlaceholder = "City",
  statePlaceholder = "State/Region",
}: AddressFieldsProps) {
  const isIndonesia = values.country === "Indonesia"
  const [kabupatenList, setKabupatenList] = useState<WilayahEntry[]>([])
  const [loadingKab, setLoadingKab] = useState(false)

  // Find the selected province code from the province name
  const selectedProvince = provinceList.find((p) => p.nama === values.state)

  // Load kabupaten when province changes
  useEffect(() => {
    if (!isIndonesia || !selectedProvince) {
      setKabupatenList([])
      return
    }

    let cancelled = false
    setLoadingKab(true)

    loadProvinceData(selectedProvince.kode).then((data) => {
      if (!cancelled) {
        setKabupatenList(data.kabupaten)
        setLoadingKab(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [isIndonesia, selectedProvince?.kode])

  const handleCountryChange = useCallback(
    (value: string | null) => {
      const newCountry = value ?? ""
      if (newCountry !== values.country) {
        onChange("country", newCountry)
        // Reset cascading fields when country changes
        onChange("state", "")
        onChange("city", "")
      }
    },
    [values.country, onChange]
  )

  const handleProvinceChange = useCallback(
    (value: string | null) => {
      const newState = value ?? ""
      if (newState !== values.state) {
        onChange("state", newState)
        // Reset city when province changes
        onChange("city", "")
      }
    },
    [values.state, onChange]
  )

  const handleKabupatenChange = useCallback(
    (value: string | null) => {
      onChange("city", value ?? "")
    },
    [onChange]
  )

  return (
    <div className="grid grid-cols-4 gap-3">
      {/* City */}
      <div className="space-y-1.5">
        <Label>City</Label>
        {isIndonesia ? (
          <Combobox
            value={values.city || null}
            onValueChange={handleKabupatenChange}
          >
            <ComboboxInput
              placeholder={
                !selectedProvince
                  ? "Select province first"
                  : loadingKab
                    ? "Loading..."
                    : "Search kabupaten/kota..."
              }
              disabled={!selectedProvince || loadingKab}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxList>
                {kabupatenList.map((k) => (
                  <ComboboxItem key={k.kode} value={k.nama}>
                    {k.nama}
                  </ComboboxItem>
                ))}
              </ComboboxList>
              <ComboboxEmpty>No results found</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        ) : (
          <Input
            placeholder={cityPlaceholder}
            value={values.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        )}
      </div>

      {/* State/Region */}
      <div className="space-y-1.5">
        <Label>{stateLabel}</Label>
        {isIndonesia ? (
          <Combobox
            value={values.state || null}
            onValueChange={handleProvinceChange}
          >
            <ComboboxInput
              placeholder="Search province..."
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxList>
                {provinceList.map((p) => (
                  <ComboboxItem key={p.kode} value={p.nama}>
                    {p.nama}
                  </ComboboxItem>
                ))}
              </ComboboxList>
              <ComboboxEmpty>No results found</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        ) : (
          <Input
            placeholder={statePlaceholder}
            value={values.state}
            onChange={(e) => onChange("state", e.target.value)}
          />
        )}
      </div>

      {/* Postal Code — always text input */}
      <div className="space-y-1.5">
        <Label>Postal Code</Label>
        <Input
          placeholder="Postal Code"
          value={values.postalCode}
          onChange={(e) => onChange("postalCode", e.target.value)}
        />
      </div>

      {/* Country */}
      <div className="space-y-1.5">
        <Label>Country</Label>
        <Combobox
          value={values.country || null}
          onValueChange={handleCountryChange}
        >
          <ComboboxInput
            placeholder="Search country..."
            className="w-full"
          />
          <ComboboxContent>
            <ComboboxList>
              {countries.map((c) => (
                <ComboboxItem key={c} value={c}>
                  {c}
                </ComboboxItem>
              ))}
            </ComboboxList>
            <ComboboxEmpty>No results found</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  )
}
