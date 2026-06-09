"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  Car, 
  Check, 
  AlertCircle, 
  FileText, 
  Users, 
  Camera, 
  AlertTriangle, 
  Info, 
  Calendar, 
  DollarSign, 
  Wrench, 
  X, 
  Maximize2,
  Clock
} from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  getMechanicsAction,
  searchCustomerAction,
  searchVehicleAction,
  createWorkOrderAction,
  getCurrentUserAction,
  updateWorkOrderAction,
  getWorkOrderAction
} from "@/lib/actions/orders-actions"
import { getPartsAction } from "@/lib/actions/parts-actions"
import { getServicesAction } from "@/lib/actions/services-actions"
import dynamic from "next/dynamic"
import { 
  getFipeBrandsAction, 
  getFipeModelsAction, 
  getFipeYearsAction 
} from "@/lib/actions/fipe-actions"
import { Printer } from "lucide-react"

const ThermalPrinterCard = dynamic(
  () => import("@/components/pdf/thermal-printer-card").then((m) => ({ default: m.ThermalPrinterCard })),
  { ssr: false, loading: () => null }
)

const springConfig = { type: "spring" as const, stiffness: 300, damping: 28 }

interface Customer {
  id: string
  name: string
  phone: string
  document: string | null
  email: string | null
  address: string | null
  riskProfile: string | null
}

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number | null
  engine: string | null
  mileage: number | null
}

interface Mechanic {
  id: string
  name: string
  email: string
  commissionRate: string
}

interface PartItem {
  id: string
  name: string
  brand: string | null
  sku: string | null
  salePrice: string
  costPrice: string
  quantity: number
  overrides?: Array<{ carName: string; price: string }>
}

interface ServiceItem {
  id: string
  name: string
  basePrice: string
  estimatedTimeMinutes: number
  overrides?: Array<{ carName: string; price: string }>
}

interface OSItem {
  type: 'PART' | 'SERVICE'
  itemId: string // partId ou serviceId
  name: string
  quantity: number
  unitCostPrice: string
  unitSalePrice: string
  isApproved: number // 0 = Pendente, 1 = Aprovado, 2 = Recusado
  hasOverride: boolean
}

// Mock de busca de placa externa
const mockPlateLookup = (plate: string) => {
  const clean = plate.toUpperCase().replace("-", "").trim();
  const db: Record<string, Partial<Vehicle>> = {
    "KPR2026": { brand: "Toyota", model: "Corolla Altis Hybrid", year: 2023, engine: "1.8 Flex", mileage: 34500 },
    "JXT9E99": { brand: "Honda", model: "Civic Sedan Touring", year: 2021, engine: "1.5 Turbo", mileage: 48000 },
    "ABC1234": { brand: "Volkswagen", model: "Golf GTI", year: 2018, engine: "2.0 TSI", mileage: 72000 },
    "ONX9A01": { brand: "Chevrolet", model: "Onix Hatch Premier", year: 2022, engine: "1.0 Turbo", mileage: 19800 },
    "HB20G4": { brand: "Hyundai", model: "HB20 Evolution", year: 2020, engine: "1.0 Flex", mileage: 53100 },
  };
  return db[clean] || null;
}

// ─── Printer Popover (New/Edit OS) ───────────────────────────────────────────
function NewOSPrinterPopover({
  orderId,
  osNumber,
  status,
}: {
  orderId: string;
  osNumber?: number | null;
  status: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-full px-4 py-2.5 transition-all active:scale-95"
        title="Imprimir / Gerar PDF"
      >
        <Printer className="size-3.5" />
        Imprimir
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-full mb-3 left-0 z-50"
          >
            <ThermalPrinterCard
              orderId={orderId}
              osNumber={osNumber ?? 0}
              status={status}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-16 flex flex-col items-center justify-center gap-3 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen">
        <Loader2 className="size-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-muted-foreground font-semibold">Carregando painel de O.S...</span>
      </div>
    }>
      <NewWorkOrderForm />
    </Suspense>
  )
}

function NewWorkOrderForm() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [catalogParts, setCatalogParts] = useState<PartItem[]>([])
  const [catalogServices, setCatalogServices] = useState<ServiceItem[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // 1. Estados do Cliente
  const [custQuery, setCustQuery] = useState("")
  const [custSearchResults, setCustSearchResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // Novos dados do cliente se cadastrando na hora
  const [newCustName, setNewCustName] = useState("")
  const [newCustPhone, setNewCustPhone] = useState("")
  const [newCustDocument, setNewCustDocument] = useState("")
  const [newCustEmail, setNewCustEmail] = useState("")
  const [newCustAddress, setNewCustAddress] = useState("")
  const [showNewCustFields, setShowNewCustFields] = useState(false)

  // 2. Estados do Veículo
  const [vehPlate, setVehPlate] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehBrand, setVehBrand] = useState("")
  const [vehModel, setVehModel] = useState("")
  const [vehYear, setVehYear] = useState("")
  const [vehEngine, setVehEngine] = useState("")
  const [vehMileage, setVehMileage] = useState("")
  const [fuelLevel, setFuelLevel] = useState("1/2")

  // FIPE states
  const [fipeBrands, setFipeBrands] = useState<{ code: string; name: string }[]>([])
  const [fipeModels, setFipeModels] = useState<{ code: string; name: string }[]>([])
  const [fipeYears, setFipeYears] = useState<{ code: string; name: string }[]>([])
  const [selectedFipeBrandCode, setSelectedFipeBrandCode] = useState("")
  const [selectedFipeModelCode, setSelectedFipeModelCode] = useState("")
  const [isManualInput, setIsManualInput] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingYears, setLoadingYears] = useState(false)
  const [brandSearch, setBrandSearch] = useState("")
  const [modelSearch, setModelSearch] = useState("")
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const loadFipeBrands = async () => {
    if (fipeBrands.length > 0) return
    setLoadingBrands(true)
    const res = await getFipeBrandsAction()
    if (res.success && res.data) {
      setFipeBrands(res.data)
    }
    setLoadingBrands(false)
  }

  const handleFipeBrandChange = async (brandCode: string) => {
    setSelectedFipeBrandCode(brandCode)
    setSelectedFipeModelCode("")
    setFipeModels([])
    setFipeYears([])
    
    const found = fipeBrands.find(b => b.code === brandCode)
    if (found) {
      setVehBrand(found.name)
      setVehModel("")
      setVehYear("")
      setModelSearch("")
    }

    if (!brandCode) return

    setLoadingModels(true)
    const res = await getFipeModelsAction(brandCode)
    if (res.success && res.data) {
      setFipeModels(res.data)
    }
    setLoadingModels(false)
  }

  const handleFipeModelChange = async (modelCode: string) => {
    setSelectedFipeModelCode(modelCode)
    setFipeYears([])
    
    const found = fipeModels.find(m => m.code === modelCode)
    if (found) {
      setVehModel(found.name)
      setVehYear("")
    }

    if (!selectedFipeBrandCode || !modelCode) return

    setLoadingYears(true)
    const res = await getFipeYearsAction(selectedFipeBrandCode, modelCode)
    if (res.success && res.data) {
      setFipeYears(res.data)
    }
    setLoadingYears(false)
  }

  const handleFipeYearChange = (yearValue: string) => {
    const match = yearValue.match(/^\d{4}/)
    if (match) {
      setVehYear(match[0])
    } else {
      setVehYear(yearValue)
    }
  }

  // 3. Checklist e Check-in
  const [checklist, setChecklist] = useState<Record<string, 'P' | 'A' | 'N'>>({
    step: 'P',
    macaco: 'P',
    chaveRoda: 'P',
    antena: 'P',
    radio: 'P',
    tapetes: 'P',
    calotas: 'P'
  })
  const [hasDamages, setHasDamages] = useState(false)
  const [damagesList, setDamagesList] = useState<Array<{ part: string; type: string }>>([])
  const [damageMenuArea, setDamageMenuArea] = useState<string | null>(null)

  // Fotos de Check-in
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<string | null>(null)

  // 4. Triagem, Diagnóstico e Alocação
  const [symptoms, setSymptoms] = useState("")
  const [diagnostic, setDiagnostic] = useState("")
  const [selectedMechanicId, setSelectedMechanicId] = useState("")
  const [allocatedBox, setAllocatedBox] = useState("")

  // 5. Grade de Itens
  const [osItems, setOsItems] = useState<OSItem[]>([])
  const [searchItemQuery, setSearchItemQuery] = useState("")
  const [searchItemType, setSearchItemType] = useState<'PART' | 'SERVICE'>('SERVICE')
  const [showItemDropdown, setShowItemDropdown] = useState<number | null>(null) // index da linha ativo

  // 6. Resumo Financeiro
  const [discount, setDiscount] = useState("0")
  const [surcharge, setSurcharge] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState("Pix")
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'LATE'>('PENDING')
  const [warranty, setWarranty] = useState("")

  // Status da OS e Timeline
  const [osStatus, setOsStatus] = useState<'CHECK_IN' | 'AWAITING_BUDGET' | 'AWAITING_APPROVAL' | 'AWAITING_PARTS' | 'IN_PROGRESS' | 'TESTING_WASHING' | 'READY' | 'DELIVERED'>('CHECK_IN')

  // Refs para cliques fora
  const clientSearchRef = useRef<HTMLDivElement>(null)
  const itemsContainerRef = useRef<HTMLDivElement>(null)

  const [isEditLoaded, setIsEditLoaded] = useState(false)
  const [editOsNumber, setEditOsNumber] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const editId = searchParams.get("id")

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true)
      const [userRes, mechRes, partsRes, servsRes] = await Promise.all([
        getCurrentUserAction(),
        getMechanicsAction(),
        getPartsAction(),
        getServicesAction()
      ])

      if (userRes.success) setCurrentUser(userRes.data)
      if (mechRes.success && mechRes.data) setMechanics(mechRes.data as Mechanic[])
      if (partsRes.success && partsRes.data) setCatalogParts(partsRes.data as unknown as PartItem[])
      if (servsRes.success && servsRes.data) setCatalogServices(servsRes.data as unknown as ServiceItem[])
      setIsLoading(false)
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    async function loadEditOS() {
      setIsLoading(true)
      const res = await getWorkOrderAction(editId!)
      if (res.success && res.data) {
        const order = res.data
        
        // Carrega Cliente
        if (order.customer) {
          setSelectedCustomer(order.customer)
          setCustQuery(order.customer.name)
        }
        
        // Carrega Veículo
        if (order.vehicle) {
          setSelectedVehicle(order.vehicle)
          setVehPlate(order.vehicle.plate)
          setVehBrand(order.vehicle.brand)
          setVehModel(order.vehicle.model)
          setVehYear(String(order.vehicle.year || ""))
          setVehEngine(order.vehicle.engine || "")
          setVehMileage(String(order.currentMileage || ""))
        }
        
        setFuelLevel(order.fuelLevel || "1/2")
        setSymptoms(order.notes || "")
        setDiagnostic(order.diagnostic || "")
        setSelectedMechanicId(order.mechanicId || "")
        setAllocatedBox(order.allocatedBox || "")
        setDiscount(order.discount || "0")
        setSurcharge(order.surcharge || "0")
        setPaymentMethod(order.paymentMethod || "Pix")
        setPaymentStatus(order.paymentStatus)
        setWarranty(order.warranty || "")
        setOsStatus(order.status)
        if (order.osNumber) setEditOsNumber(order.osNumber)
        
        if (order.photoUrls) {
          setPhotoUrls(order.photoUrls)
        }
        
        if (order.checklist) {
          try {
            setChecklist(JSON.parse(order.checklist))
          } catch(e) {}
        }
        
        if (order.damages) {
          try {
            setDamagesList(JSON.parse(order.damages))
          } catch(e) {}
        }
        
        if (order.items) {
          const mappedItems = order.items.map((it: any) => ({
            type: it.type,
            itemId: (it.type === 'PART' ? it.partId : it.serviceId) || '',
            name: it.customName || (it.type === 'PART' ? it.partName : it.serviceName) || '',
            quantity: it.quantity,
            unitCostPrice: it.unitCostPrice,
            unitSalePrice: it.unitSalePrice,
            isApproved: it.isApproved,
            hasOverride: false
          }))
          setOsItems(mappedItems)
        }
      } else {
        setErrorMsg(res.error || "Erro ao carregar O.S. para edição.")
      }
      setIsEditLoaded(true)
      setIsLoading(false)
    }

    if (!isLoading && editId && !isEditLoaded) {
      loadEditOS()
    }
  }, [editId, isLoading, isEditLoaded])

  // Auto-search Cliente ao digitar query
  useEffect(() => {
    if (custQuery.length < 3) {
      setCustSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      const res = await searchCustomerAction(custQuery)
      if (res.success && res.data) {
        setCustSearchResults(res.data as Customer[])
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [custQuery])

  // Fecha busca de cliente e dropdown de itens se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setCustSearchResults([])
      }
      if (itemsContainerRef.current && !itemsContainerRef.current.contains(event.target as Node)) {
        setShowItemDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Busca placa ao digitar (7 dígitos sem pontuação ou com ela)
  const handlePlateChange = async (val: string) => {
    const rawPlate = val.toUpperCase().replace(/[^A-Z0-9]/g, "")
    setVehPlate(val.toUpperCase())

    if (rawPlate.length >= 7) {
      // 1. Busca no banco
      const res = await searchVehicleAction(rawPlate)
      if (res.success && res.data) {
        const v = res.data
        setSelectedVehicle({
          id: v.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          engine: v.engine,
          mileage: v.mileage
        })
        setVehBrand(v.brand)
        setVehModel(v.model)
        setVehYear(v.year ? String(v.year) : "")
        setVehEngine(v.engine || "")
        setVehMileage(v.mileage ? String(v.mileage) : "")
        setIsManualInput(true) // Preenchido automaticamente do banco, então habilita o manual
        
        if (v.customer) {
          setSelectedCustomer(v.customer as Customer)
          setCustQuery("")
          setShowNewCustFields(false)
        }
        return
      }

      // 2. Busca no mock de API externa
      const mockResult = mockPlateLookup(rawPlate)
      if (mockResult) {
        setSelectedVehicle(null) // veículo novo no banco
        setVehBrand(mockResult.brand || "")
        setVehModel(mockResult.model || "")
        setVehYear(mockResult.year ? String(mockResult.year) : "")
        setVehEngine(mockResult.engine || "")
        setVehMileage(mockResult.mileage ? String(mockResult.mileage) : "")
        setIsManualInput(true) // Preenchido automaticamente do mock, então habilita o manual
      }
    } else {
      setSelectedVehicle(null)
    }
  }

  // Compressão e Upload de Imagens no client
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)

    const compressedPromises = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (readerEvent) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            const MAX_WIDTH = 800
            let width = img.width
            let height = img.height

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width)
              width = MAX_WIDTH
            }

            canvas.width = width
            canvas.height = height
            ctx?.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL("image/jpeg", 0.85))
          }
          img.src = readerEvent.target?.result as string
        }
        reader.readAsDataURL(file)
      })
    })

    const newCompressedPhotos = await Promise.all(compressedPromises)
    setPhotoUrls((prev) => [...prev, ...newCompressedPhotos])
  }

  // Adiciona item na grade de peças/serviços
  const handleAddRow = () => {
    setOsItems((prev) => [
      ...prev,
      {
        type: 'SERVICE',
        itemId: "",
        name: "",
        quantity: 1,
        unitCostPrice: "0",
        unitSalePrice: "0",
        isApproved: 0, // Pendente por padrão
        hasOverride: false
      }
    ])
  }

  // Remove item da grade
  const handleRemoveRow = (index: number) => {
    setOsItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Atualiza campo do item na grade
  const handleUpdateItemRow = (index: number, key: keyof OSItem, val: any) => {
    setOsItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [key]: val }
      return updated
    })
  }

  // Seleciona item do autocompleter na grade
  const handleSelectCatalogItem = (index: number, type: 'PART' | 'SERVICE', item: any) => {
    let price = item.basePrice || item.salePrice
    let cost = item.costPrice || "0"
    let hasOverride = false

    // Verifica sobregravações (overrides) baseadas no modelo do veículo cadastrado
    const activeCarModel = vehModel.toLowerCase().trim()
    if (activeCarModel && item.overrides && item.overrides.length > 0) {
      const matchingOverride = item.overrides.find((o: any) => 
        activeCarModel.includes(o.carName.toLowerCase().trim()) || 
        o.carName.toLowerCase().trim().includes(activeCarModel)
      )
      if (matchingOverride) {
        price = matchingOverride.price
        hasOverride = true
      }
    }

    setOsItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        itemId: item.id,
        name: item.name,
        unitCostPrice: cost,
        unitSalePrice: price,
        hasOverride
      }
      return updated
    })
    setShowItemDropdown(null)
  }

  // Cálculos financeiros baseados apenas nos itens aprovados (status = 1)
  const approvedPartsTotal = osItems
    .filter((it) => it.type === 'PART' && it.isApproved === 1)
    .reduce((sum, it) => sum + it.quantity * parseFloat(it.unitSalePrice), 0)

  const approvedServicesTotal = osItems
    .filter((it) => it.type === 'SERVICE' && it.isApproved === 1)
    .reduce((sum, it) => sum + it.quantity * parseFloat(it.unitSalePrice), 0)

  // Lucro líquido: apenas itens aprovados (Preço Venda - Preço Custo) * Qtd
  const totalCost = osItems
    .filter((it) => it.isApproved === 1)
    .reduce((sum, it) => sum + it.quantity * parseFloat(it.unitCostPrice), 0)

  const totalSale = approvedPartsTotal + approvedServicesTotal
  const finalDiscount = parseFloat(discount) || 0
  const finalSurcharge = parseFloat(surcharge) || 0
  const grandTotal = Math.max(0, totalSale - finalDiscount + finalSurcharge)
  const netProfit = totalSale - totalCost - finalDiscount + finalSurcharge

  // Comissão do mecânico
  const selectedMechanic = mechanics.find(m => m.id === selectedMechanicId)
  const mechanicCommission = selectedMechanic && approvedServicesTotal > 0
    ? (approvedServicesTotal * parseFloat(selectedMechanic.commissionRate)) / 100
    : 0

  // Máscaras de digitação rápida
  const formatDocument = (value: string) => {
    const clean = value.replace(/\D/g, "")
    if (clean.length > 11) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`
    } else if (clean.length > 9) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`
    } else if (clean.length > 6) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`
    } else if (clean.length > 3) {
      return `${clean.slice(0, 3)}.${clean.slice(3)}`
    }
    return clean
  }

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "")
    if (clean.length > 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`
    } else if (clean.length > 6) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`
    } else if (clean.length > 2) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2)}`
    } else if (clean.length > 0) {
      return `(${clean}`
    }
    return clean
  }

  // Toggles de avaria no mapa SVG
  const toggleDamage = (part: string, type: string) => {
    setDamagesList((prev) => {
      const exists = prev.find((d) => d.part === part && d.type === type)
      if (exists) {
        return prev.filter((d) => !(d.part === part && d.type === type))
      } else {
        return [...prev, { part, type }]
      }
    })
    setDamageMenuArea(null)
  }

  // Envia a OS para o servidor
  const handleSaveOS = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação de regras condicionais por status
    if (osStatus !== 'CHECK_IN') {
      // Requer preenchimento de itens e mecânico se não for entrada simples
      if (osItems.length === 0) {
        setErrorMsg("Defina ao menos um item (peça ou serviço) para salvar a O.S. nesta fase.")
        return
      }
      if (!selectedMechanicId) {
        setErrorMsg("Selecione um mecânico responsável.")
        return
      }
    }

    if (!selectedCustomer && (!newCustName || !newCustPhone)) {
      setErrorMsg("Selecione um cliente cadastrado ou insira o nome e telefone do novo cliente.")
      return
    }

    if (!vehPlate || !vehBrand || !vehModel) {
      setErrorMsg("Insira a placa, marca e modelo do veículo.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg("")
    setSuccessMsg("")

    const payload = {
      id: editId || undefined,
      customerId: selectedCustomer?.id || undefined,
      newCustomerName: !selectedCustomer ? newCustName : undefined,
      newCustomerPhone: !selectedCustomer ? newCustPhone : undefined,
      newCustomerDocument: !selectedCustomer ? newCustDocument : undefined,
      newCustomerEmail: !selectedCustomer ? newCustEmail : undefined,
      newCustomerAddress: !selectedCustomer ? newCustAddress : undefined,

      vehicleId: selectedVehicle?.id || undefined,
      newVehiclePlate: vehPlate,
      newVehicleBrand: vehBrand,
      newVehicleModel: vehModel,
      newVehicleYear: vehYear || undefined,
      newVehicleEngine: vehEngine || undefined,
      newVehicleMileage: vehMileage || undefined,

      mechanicId: selectedMechanicId || undefined,
      allocatedBox: allocatedBox || undefined,
      fuelLevel: fuelLevel || undefined,
      notes: symptoms || undefined,
      diagnostic: diagnostic || undefined,
      photoUrls: photoUrls,
      checklist: JSON.stringify(checklist),
      damages: damagesList.length > 0 ? JSON.stringify(damagesList) : undefined,
      warranty: warranty || undefined,
      discount: String(discount),
      surcharge: String(surcharge),
      paymentMethod: paymentMethod || undefined,
      paymentStatus: paymentStatus,
      status: osStatus,
      items: osItems.map((it) => ({
        type: it.type,
        partId: it.type === 'PART' && it.itemId ? it.itemId : undefined,
        serviceId: it.type === 'SERVICE' && it.itemId ? it.itemId : undefined,
        customName: it.itemId ? undefined : it.name,
        quantity: it.quantity,
        unitCostPrice: it.unitCostPrice,
        unitSalePrice: it.unitSalePrice,
        isApproved: it.isApproved
      }))
    } as any

    const res = editId
      ? await updateWorkOrderAction(payload)
      : await createWorkOrderAction(payload)
    setIsSubmitting(false)

    if (res.success) {
      setSuccessMsg(editId ? "Ordem de Serviço atualizada com sucesso!" : "Ordem de Serviço criada com sucesso!")
      setTimeout(() => {
        router.push("/panel/orders")
      }, 2000)
    } else {
      setErrorMsg(res.error || "Erro ao salvar a O.S.")
    }
  }

  // Timeline de Estados da O.S. (Etapas)
  const statusSteps = [
    { key: "CHECK_IN", label: "Check-in" },
    { key: "AWAITING_BUDGET", label: "Orçamento" },
    { key: "AWAITING_APPROVAL", label: "Aprovação" },
    { key: "IN_PROGRESS", label: "Execução" },
    { key: "READY", label: "Pronto" },
  ] as const

  const getPrimaryButtonText = () => {
    switch (osStatus) {
      case 'CHECK_IN': return "Iniciar Orçamento"
      case 'AWAITING_BUDGET': return "Finalizar Orçamento"
      case 'AWAITING_APPROVAL': return "Enviar Orçamento Whatsapp"
      case 'IN_PROGRESS': return "Finalizar Execução"
      case 'READY': return "Faturar & Entregar"
      default: return "Salvar Ordem de Serviço"
    }
  }

  const handleContextualAction = () => {
    if (osStatus === 'CHECK_IN') {
      setOsStatus('AWAITING_BUDGET')
    } else if (osStatus === 'AWAITING_BUDGET') {
      setOsStatus('AWAITING_APPROVAL')
    } else if (osStatus === 'AWAITING_APPROVAL') {
      toast.success("Simulação: Orçamento enviado por WhatsApp!")
      setOsStatus('IN_PROGRESS')
    } else if (osStatus === 'IN_PROGRESS') {
      setOsStatus('READY')
    } else if (osStatus === 'READY') {
      setPaymentStatus('PAID')
      setOsStatus('DELIVERED')
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-16 flex flex-col items-center justify-center gap-3 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen">
        <Loader2 className="size-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-muted-foreground font-semibold">Carregando painel de O.S...</span>
      </div>
    )
  }

  const isUserAdmin = currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER'

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans pb-56 md:pb-48">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Wrench className="size-4.5" />
            </span>
            {editId ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {editId 
              ? `Atualize a triagem de check-in, avarias externas, diagnóstico, mecânico e orçamento da O.S.`
              : "Abertura, triagem de check-in, visualização de avarias externas e orçamento integrado."
            }
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Check className="size-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveOS} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lado Esquerdo e Centro: Formulários e Grade (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 👤 Bloco do Cliente */}
          <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="size-4 text-emerald-500" />
                Proprietário do Veículo
              </h2>
              {!selectedCustomer && (
                <Button
                  type="button"
                  onClick={() => setShowNewCustFields(!showNewCustFields)}
                  className="text-[10px] text-emerald-500 hover:underline font-bold"
                >
                  {showNewCustFields ? "Buscar Existente" : "+ Cadastrar Novo Cliente"}
                </Button>
              )}
            </div>

            {/* Campo de Busca se não estiver cadastrando novo */}
            {!showNewCustFields && !selectedCustomer && (
              <div className="relative" ref={clientSearchRef}>
                <span className="absolute left-2.5 top-2.5 text-muted-foreground">
                  <Search className="size-3.5" />
                </span>
                <Input
                  type="text"
                  placeholder="Pesquise por celular ou CPF/CNPJ..."
                  value={custQuery}
                  onChange={(e) => setCustQuery(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg pl-8 pr-3 py-2 bg-muted/20 focus:bg-card focus:outline-hidden font-medium text-foreground placeholder-muted-foreground/50"
                />
                
                {/* Lista de Resultados Dropdown */}
                {custSearchResults.length > 0 && (
                  <div className="absolute top-10 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden text-xs">
                    {custSearchResults.map((c) => (
                      <Button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustSearchResults([])
                          setCustQuery("")
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <span className="font-bold text-foreground">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{formatPhone(c.phone)}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Visualização do Cliente Selecionado */}
            {selectedCustomer && (
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{selectedCustomer.name}</span>
                    {selectedCustomer.riskProfile && (
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                        selectedCustomer.riskProfile === 'GOOD' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        selectedCustomer.riskProfile === 'WARN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        Risco: {selectedCustomer.riskProfile}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
                    <span>Fone: {formatPhone(selectedCustomer.phone)}</span>
                    {selectedCustomer.document && <span>Doc: {formatDocument(selectedCustomer.document)}</span>}
                    {selectedCustomer.address && <span>Endereço: {selectedCustomer.address}</span>}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[10px] text-red-500 hover:underline font-bold"
                >
                  Remover
                </Button>
              </div>
            )}

            {/* Campos de Novo Cliente */}
            {showNewCustFields && (
              <div className="space-y-3 p-3 bg-muted/20 border border-border/50 rounded-xl animate-in slide-in-from-top-1 duration-200">
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Novo Cliente</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Nome Completo</Label>
                    <Input
                      type="text"
                      placeholder="Ex: Carlos Albuquerque"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden text-foreground font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Telefone / WhatsApp</Label>
                    <Input
                      type="text"
                      placeholder="Ex: (21) 98888-7777"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(formatPhone(e.target.value))}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">CPF ou CNPJ</Label>
                    <Input
                      type="text"
                      placeholder="Ex: 000.000.000-00"
                      value={newCustDocument}
                      onChange={(e) => setNewCustDocument(formatDocument(e.target.value))}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden text-foreground font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">E-mail (Opcional)</Label>
                    <Input
                      type="email"
                      placeholder="Ex: carlos@email.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Endereço Completo</Label>
                  <Input
                    type="text"
                    placeholder="Ex: Av. Atlântica, 1000 - Copacabana"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden text-foreground font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 🚗 Bloco do Veículo */}
          <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Car className="size-4 text-emerald-500" />
                Especificações do Veículo
              </h2>
              <Button
                type="button"
                onClick={() => {
                  setIsManualInput(!isManualInput);
                  if (!isManualInput) {
                    if (brandSearch) setVehBrand(brandSearch);
                    if (modelSearch) setVehModel(modelSearch);
                  } else {
                    setBrandSearch(vehBrand);
                    setModelSearch(vehModel);
                  }
                }}
                className="text-[10px] text-emerald-500 hover:underline font-bold"
              >
                {isManualInput ? "Usar Busca FIPE" : "Digitar Manualmente"}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Placa</Label>
                <Input
                  type="text"
                  placeholder="KPR-2026"
                  maxLength={8}
                  value={vehPlate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-extrabold font-mono placeholder-muted-foreground/30"
                />
              </div>

              {/* Marca */}
              <div className="space-y-1 relative">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Marca</Label>
                {isManualInput ? (
                  <Input
                    type="text"
                    placeholder="Ex: Toyota"
                    value={vehBrand}
                    onChange={(e) => setVehBrand(e.target.value)}
                    className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium"
                  />
                ) : (
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="BUSCAR MARCA..."
                      value={brandSearch}
                      onChange={(e) => {
                        setBrandSearch(e.target.value);
                        setShowBrandDropdown(true);
                      }}
                      onFocus={() => {
                        loadFipeBrands();
                        setShowBrandDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowBrandDropdown(false), 250)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium uppercase"
                    />
                    {showBrandDropdown && (
                      <div className="absolute top-9 left-0 right-0 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-30 text-[10px] uppercase no-scrollbar">
                        {loadingBrands ? (
                          <div className="p-3 text-muted-foreground text-center font-medium">Carregando marcas...</div>
                        ) : (
                          fipeBrands
                            .filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                            .map(b => (
                              <Button
                                key={b.code}
                                type="button"
                                onMouseDown={() => {
                                  handleFipeBrandChange(b.code);
                                  setBrandSearch(b.name);
                                  setShowBrandDropdown(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-muted font-bold text-foreground border-b border-border/20 last:border-b-0"
                              >
                                {b.name}
                              </Button>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modelo */}
              <div className="space-y-1 col-span-2 sm:col-span-2 relative">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Modelo</Label>
                {isManualInput ? (
                  <Input
                    type="text"
                    placeholder="Ex: Corolla Altis Hybrid"
                    value={vehModel}
                    onChange={(e) => setVehModel(e.target.value)}
                    className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-bold"
                  />
                ) : (
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={selectedFipeBrandCode ? "BUSCAR MODELO..." : "SELECIONE A MARCA"}
                      disabled={!selectedFipeBrandCode}
                      value={modelSearch}
                      onChange={(e) => {
                        setModelSearch(e.target.value);
                        setShowModelDropdown(true);
                      }}
                      onFocus={() => {
                        if (selectedFipeBrandCode) setShowModelDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowModelDropdown(false), 250)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-bold uppercase"
                    />
                    {showModelDropdown && selectedFipeBrandCode && (
                      <div className="absolute top-9 left-0 right-0 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-30 text-[10px] uppercase no-scrollbar">
                        {loadingModels ? (
                          <div className="p-3 text-muted-foreground text-center font-medium">Carregando modelos...</div>
                        ) : (
                          fipeModels
                            .filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()))
                            .map(m => (
                              <Button
                                key={m.code}
                                type="button"
                                onMouseDown={() => {
                                  handleFipeModelChange(m.code);
                                  setModelSearch(m.name);
                                  setShowModelDropdown(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-muted font-bold text-foreground border-b border-border/20 last:border-b-0"
                              >
                                {m.name}
                              </Button>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Motorização</Label>
                <Input
                  type="text"
                  placeholder="Ex: 1.8 Flex"
                  value={vehEngine}
                  onChange={(e) => setVehEngine(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Ano</Label>
                {isManualInput ? (
                  <Input
                    type="number"
                    placeholder="Ex: 2023"
                    value={vehYear}
                    onChange={(e) => setVehYear(e.target.value)}
                    className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium"
                  />
                ) : (
                  <select
                    disabled={!selectedFipeModelCode}
                    value={fipeYears.find(y => y.name.startsWith(vehYear))?.code || ""}
                    onChange={(e) => handleFipeYearChange(e.target.value)}
                    className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium uppercase"
                  >
                    <option value="">-- SELECIONE --</option>
                    {loadingYears ? (
                      <option disabled>Carregando...</option>
                    ) : (
                      fipeYears.map(y => (
                        <option key={y.code} value={y.code}>
                          {y.name}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Km Atual</Label>
                <Input
                  type="number"
                  placeholder="Ex: 34500"
                  value={vehMileage}
                  onChange={(e) => setVehMileage(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-bold"
                />
              </div>
            </div>

            {/* Nível de Combustível */}
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Nível de Combustível no Check-in</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {["Reserva", "1/4", "1/2", "3/4", "Cheio"].map((lvl) => (
                  <Button
                    key={lvl}
                    type="button"
                    onClick={() => setFuelLevel(lvl)}
                    className={`text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                      fuelLevel === lvl
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30 scale-102 shadow-xs"
                        : "bg-muted/40 hover:bg-muted/70 text-muted-foreground border-transparent"
                    }`}
                  >
                    {lvl}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 📋 Bloco de Entrada, Checklist e Triagem */}
          <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="size-4 text-emerald-500" />
              Check-in, Acessórios & Avarias
            </h2>

            {/* Sintomas */}
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Sintomas Relatados (Queixa do Cliente)</Label>
              <Textarea
                rows={2}
                placeholder="Ex: Barulho metálico ao frear a roda dianteira esquerda, trepidação do volante..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full text-xs border border-border rounded-lg p-2.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium"
              />
            </div>

            {/* Checklist de Acessórios */}
            <div className="space-y-2 border-t border-dashed border-border pt-4">
              <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">Checklist de Itens e Acessórios</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries({
                  step: "Estep / Roda Sobressalente",
                  macaco: "Macaco Hidráulico/Mecânico",
                  chaveRoda: "Chave de Roda",
                  antena: "Antena Externa",
                  radio: "Som / Rádio Central",
                  tapetes: "Tapetes Internos",
                  calotas: "Calotas Integradas"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-muted/20 border border-border/30 rounded-xl">
                    <span className="font-semibold text-muted-foreground text-[10px]">{label}</span>
                    <div className="flex gap-1">
                      {["P", "A", "N"].map((opt) => (
                        <Button
                          key={opt}
                          type="button"
                          onClick={() => setChecklist((prev) => ({ ...prev, [key]: opt as any }))}
                          className={`size-6 rounded-md text-[9px] font-bold flex items-center justify-center transition-all ${
                            checklist[key] === opt
                              ? opt === 'P' ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" :
                                opt === 'A' ? "bg-red-500/20 text-red-600 border border-red-500/30" :
                                "bg-zinc-500/20 text-zinc-600 border border-zinc-500/30"
                              : "bg-muted/40 hover:bg-muted/70 text-muted-foreground"
                          }`}
                          title={opt === 'P' ? 'Presente' : opt === 'A' ? 'Ausente' : 'Não se aplica'}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggle de Avarias Externas */}
            <div className="space-y-3 border-t border-dashed border-border pt-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDamages}
                    onChange={(e) => setHasDamages(e.target.checked)}
                    className="rounded-md border-border text-emerald-500 focus:ring-emerald-500/30 size-4.5"
                  />
                  <span className="text-[11px] font-bold text-foreground">O veículo possui avarias externas (riscos, amassados)?</span>
                </label>
              </div>

              {/* Diagrama de Carro SVG se tiver avarias */}
              {hasDamages && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springConfig}
                  className="bg-muted/20 border border-border/50 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 justify-center"
                >
                  <div className="relative">
                    {/* SVG Silhueta do Carro (Vista de cima) */}
                    <svg viewBox="0 0 200 400" className="w-40 h-80 text-muted-foreground dark:text-zinc-600 fill-none stroke-current stroke-[2.5]">
                      <path d="M 50,80 C 50,55 60,35 100,35 C 140,35 150,55 150,80 L 155,120 C 158,140 160,200 160,260 L 155,340 C 150,360 140,370 100,370 C 60,370 50,360 45,340 L 40,260 C 40,200 42,140 45,120 Z" />
                      <path d="M 55,135 Q 100,115 145,135 Q 140,155 135,165 L 65,165 Z" className="opacity-70" />
                      <path d="M 60,295 Q 100,310 140,295 Q 135,280 130,275 L 70,275 Z" className="opacity-70" />
                      <rect x="62" y="175" width="76" height="90" rx="8" className="opacity-40" />
                      <path d="M 60,85 L 60,110" />
                      <path d="M 140,85 L 140,110" />
                    </svg>

                    {/* Hotspots Clicáveis */}
                    {[
                      { area: "Frente", top: "7%", left: "45%" },
                      { area: "Capô", top: "18%", left: "45%" },
                      { area: "Parabrisa", top: "30%", left: "45%" },
                      { area: "Lateral Esquerda", top: "45%", left: "12%" },
                      { area: "Lateral Direita", top: "45%", left: "78%" },
                      { area: "Teto", top: "50%", left: "45%" },
                      { area: "Porta-malas", top: "78%", left: "45%" },
                      { area: "Traseira", top: "89%", left: "45%" }
                    ].map((spot) => {
                      const count = damagesList.filter(d => d.part === spot.area).length
                      return (
                        <div
                          key={spot.area}
                          style={{ top: spot.top, left: spot.left }}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                        >
                          <Button
                            type="button"
                            onClick={() => setDamageMenuArea(damageMenuArea === spot.area ? null : spot.area)}
                            className={`size-6 rounded-full flex items-center justify-center text-[9px] font-extrabold border transition-all ${
                              count > 0
                                ? "bg-red-500 border-red-600 text-white animate-pulse"
                                : "bg-card border-border hover:border-emerald-500 text-foreground"
                            }`}
                            title={`Avarias em ${spot.area}`}
                          >
                            {count > 0 ? count : "+"}
                          </Button>
                          
                          {/* Menu flutuante de avarias da área */}
                          {damageMenuArea === spot.area && (
                            <div className="absolute left-7 top-0 bg-card border border-border rounded-xl shadow-lg z-20 p-2 min-w-32 flex flex-col gap-1 text-[10px] animate-in fade-in zoom-in-95">
                              <div className="font-bold text-foreground pb-1 border-b border-dashed border-border uppercase text-[8px]">{spot.area}</div>
                              {["Riscado", "Amassado", "Quebrado", "Trincado"].map((type) => {
                                const active = damagesList.some(d => d.part === spot.area && d.type === type)
                                return (
                                  <Button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleDamage(spot.area, type)}
                                    className={`w-full text-left px-2 py-1 rounded transition-colors flex items-center justify-between font-semibold ${
                                      active ? "bg-red-500/10 text-red-500" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    <span>{type}</span>
                                    {active && <Check className="size-3" />}
                                  </Button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Lista de avarias listadas em badges */}
                  <div className="flex-1 space-y-2 max-h-80 overflow-y-auto">
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">Lista de Avarias Relatadas</div>
                    {damagesList.length === 0 ? (
                      <div className="text-[10px] text-muted-foreground italic">Clique nos marcadores do carro para registrar.</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {damagesList.map((dmg, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          >
                            <span>{dmg.type} - {dmg.part}</span>
                            <Button
                              type="button"
                              onClick={() => toggleDamage(dmg.part, dmg.type)}
                              className="hover:text-red-700 size-3 rounded-full flex items-center justify-center p-0 bg-transparent border-0"
                            >
                              <X className="size-2.5" />
                            </Button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Galeria de Fotos de Check-in */}
            <div className="space-y-2 border-t border-dashed border-border pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Fotos de Entrada</Label>
                <label className="flex items-center gap-1 cursor-pointer bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-1 rounded-full text-[10px] font-bold transition-colors">
                  <Camera className="size-3.5" />
                  <span>Capturar / Enviar</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {photoUrls.length === 0 ? (
                <div className="text-[10px] text-muted-foreground italic">Nenhuma foto adicionada para vistoria de check-in.</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-border group">
                      <img src={url} alt={`Check-in ${idx}`} className="size-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          onClick={() => setActiveLightboxPhoto(url)}
                          className="p-1.5 bg-card hover:bg-card/90 rounded-md text-foreground shadow-xs transition-all"
                        >
                          <Maximize2 className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setPhotoUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 bg-red-500 hover:bg-red-600 rounded-md text-white shadow-xs transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 🔧 Bloco de Diagnóstico e Alocação */}
          <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wrench className="size-4 text-emerald-500" />
              Diagnóstico & Atribuição de Pátio
            </h2>

            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Laudo de Diagnóstico Técnico</Label>
              <Textarea
                rows={2}
                placeholder="Ex: Realizada avaliação física. Pastilhas encontram-se com desgaste crítico. Necessária a troca das pastilhas e retífica de discos de freio dianteiros..."
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                className="w-full text-xs border border-border rounded-lg p-2.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Mecânico Alocado</Label>
                <select
                  value={selectedMechanicId}
                  onChange={(e) => setSelectedMechanicId(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-semibold"
                >
                  <option value="">Nenhum mecânico alocado</option>
                  {mechanics.map((mech) => (
                    <option key={mech.id} value={mech.id}>
                      {mech.name} (Comissão: {mech.commissionRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Box / Elevador Alocado</Label>
                <Input
                  type="text"
                  placeholder="Ex: Rampa 02, Elevador 03"
                  value={allocatedBox}
                  onChange={(e) => setAllocatedBox(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-medium"
                />
              </div>
            </div>
          </div>

          <div ref={itemsContainerRef} className="bg-card rounded-3xl p-5 border border-border/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wrench className="size-4 text-emerald-500" />
                Orçamento de Peças e Serviços
              </h2>
              <Button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-all"
              >
                <Plus className="size-3" />
                Adicionar Item
              </Button>
            </div>

            {osStatus === 'CHECK_IN' && osItems.length === 0 && (
              <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl text-[11px] text-muted-foreground flex flex-col items-center gap-1.5">
                <Info className="size-5 text-amber-500" />
                <span>O lançamento de itens é opcional nesta fase de **Check-in** (primeiro contato).</span>
                <span className="text-[9px]">Você pode salvar a O.S. sem preencher orçamentos e itens agora.</span>
              </div>
            )}

            {osItems.length > 0 && (
              <div className="space-y-3 overflow-visible">
                {osItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 bg-muted/10 border rounded-2xl space-y-3 relative transition-all duration-200 ${
                      showItemDropdown === idx 
                        ? 'z-20 border-emerald-500/30 bg-muted/20 ring-1 ring-emerald-500/10' 
                        : 'z-10 border-border/40 hover:border-border/80'
                    }`}
                  >
                    {/* Primeira linha: Identificação do Item, Tipo e Ações de Status */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5">
                      {/* Seletor Tipo (SRV / PÇ) */}
                      <div className="flex rounded-lg border border-border/60 overflow-hidden w-20 shrink-0 text-[9px] font-bold bg-muted/40">
                        <Button
                          type="button"
                          onClick={() => {
                            handleUpdateItemRow(idx, 'type', 'SERVICE')
                            handleUpdateItemRow(idx, 'itemId', '')
                            handleUpdateItemRow(idx, 'name', '')
                          }}
                          className={`flex-1 py-1 text-center transition-colors ${item.type === 'SERVICE' ? 'bg-foreground text-background font-black' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          SRV
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            handleUpdateItemRow(idx, 'type', 'PART')
                            handleUpdateItemRow(idx, 'itemId', '')
                            handleUpdateItemRow(idx, 'name', '')
                          }}
                          className={`flex-1 py-1 text-center transition-colors ${item.type === 'PART' ? 'bg-foreground text-background font-black' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          PÇ
                        </Button>
                      </div>

                      {/* Input de Pesquisa do Item com Auto-complete */}
                      <div className="flex-1 min-w-[200px] relative">
                        <Input
                          type="text"
                          placeholder={item.type === 'PART' ? "Pesquise Peça..." : "Pesquise Serviço..."}
                          value={item.name}
                          onChange={(e) => {
                            handleUpdateItemRow(idx, 'name', e.target.value)
                            handleUpdateItemRow(idx, 'itemId', '')
                            handleUpdateItemRow(idx, 'hasOverride', false)
                            setShowItemDropdown(idx)
                          }}
                          onFocus={() => setShowItemDropdown(idx)}
                          className="w-full text-xs bg-muted/20 border border-border/40 hover:border-border rounded-lg px-3 py-1.5 focus:outline-hidden text-foreground font-semibold"
                        />

                        {/* Dropdown Auto-complete */}
                        {showItemDropdown === idx && (
                          <div className="absolute left-0 top-10 bg-card border border-border rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto text-xs w-[280px] sm:w-[380px]">
                            {item.type === 'PART' ? (
                              catalogParts
                                .filter(p => p.name.toLowerCase().includes(item.name.toLowerCase()))
                                .map(p => (
                                  <Button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelectCatalogItem(idx, 'PART', p)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-medium flex items-center justify-between border-b border-border/30 last:border-0"
                                  >
                                    <span>{p.name} ({p.brand})</span>
                                    <span className="text-[10px] font-bold text-emerald-500 font-mono">R$ {p.salePrice}</span>
                                  </Button>
                                ))
                            ) : (
                              catalogServices
                                .filter(s => s.name.toLowerCase().includes(item.name.toLowerCase()))
                                .map(s => (
                                  <Button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleSelectCatalogItem(idx, 'SERVICE', s)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-medium flex items-center justify-between border-b border-border/30 last:border-0"
                                  >
                                    <span>{s.name}</span>
                                    <span className="text-[10px] font-bold text-emerald-500 font-mono">R$ {s.basePrice}</span>
                                  </Button>
                                ))
                            )}
                            {item.name.trim() !== "" && (
                              <Button
                                type="button"
                                onClick={() => {
                                  handleUpdateItemRow(idx, 'itemId', '')
                                  handleUpdateItemRow(idx, 'hasOverride', false)
                                  setShowItemDropdown(null)
                                }}
                                className="w-full text-left px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-t border-border hover:bg-emerald-500/25 flex items-center justify-between"
                              >
                                <span className="truncate">Usar "{item.name}" como item temporário</span>
                                <span className="text-[9px] uppercase font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm shrink-0">Temporário</span>
                              </Button>
                            )}
                            <Button
                              type="button"
                              onClick={() => setShowItemDropdown(null)}
                              className="w-full text-center py-1 bg-muted/30 text-[9px] font-bold hover:bg-muted text-muted-foreground border-t border-border"
                            >
                              Fechar Lista
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Status (Tri-state) */}
                      <div className="flex rounded-lg overflow-hidden border border-border/40 text-[9px] font-extrabold bg-muted/40 shrink-0">
                        <Button
                          type="button"
                          onClick={() => handleUpdateItemRow(idx, 'isApproved', 0)}
                          className={`px-2.5 py-1.5 flex items-center justify-center gap-1 transition-colors ${item.isApproved === 0 ? 'bg-amber-500 text-white font-black' : 'text-muted-foreground hover:bg-muted/70'}`}
                          title="Pendente"
                        >
                          <Clock className="size-3.5" />
                          <span>Pend.</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleUpdateItemRow(idx, 'isApproved', 1)}
                          className={`px-2.5 py-1.5 flex items-center justify-center gap-1 transition-colors ${item.isApproved === 1 ? 'bg-emerald-500 text-white font-black' : 'text-muted-foreground hover:bg-muted/70'}`}
                          title="Aprovado"
                        >
                          <Check className="size-3.5" />
                          <span>Aprov.</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleUpdateItemRow(idx, 'isApproved', 2)}
                          className={`px-2.5 py-1.5 flex items-center justify-center gap-1 transition-colors ${item.isApproved === 2 ? 'bg-red-500 text-white font-black' : 'text-muted-foreground hover:bg-muted/70'}`}
                          title="Recusado"
                        >
                          <X className="size-3.5" />
                          <span>Recus.</span>
                        </Button>
                      </div>

                      {/* Remover */}
                      <Button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Segunda linha: Qtd, Valores e Subtotal */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-dashed border-border/40 text-xs">
                      {/* Controle de Quantidade */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Qtd:</span>
                        <div className="inline-flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 border border-border/40">
                          <Button
                            type="button"
                            onClick={() => handleUpdateItemRow(idx, 'quantity', Math.max(1, item.quantity - 1))}
                            className="size-5 rounded-md hover:bg-muted text-[10px] font-extrabold flex items-center justify-center"
                          >
                            -
                          </Button>
                          <span className="font-bold text-[11px] w-6 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            onClick={() => handleUpdateItemRow(idx, 'quantity', item.quantity + 1)}
                            className="size-5 rounded-md hover:bg-muted text-[10px] font-extrabold flex items-center justify-center"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Valores Financeiros */}
                      <div className="flex flex-wrap items-center gap-4 ml-auto">
                        {/* Preço de Custo (apenas Admin) */}
                        {isUserAdmin && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Custo:</span>
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-[9px] font-bold text-muted-foreground">R$</span>
                              <Input
                                type="text"
                                value={item.unitCostPrice}
                                onChange={(e) => handleUpdateItemRow(idx, 'unitCostPrice', e.target.value)}
                                className="w-16 text-right bg-muted/20 border border-border/40 rounded-md px-1.5 py-0.5 pl-6 font-mono text-[10px]"
                              />
                            </div>
                          </div>
                        )}

                        {/* Preço de Venda */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Venda:</span>
                          <div className="flex flex-col items-end">
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-[9px] font-bold text-muted-foreground">R$</span>
                              <Input
                                type="text"
                                value={item.unitSalePrice}
                                onChange={(e) => handleUpdateItemRow(idx, 'unitSalePrice', e.target.value)}
                                className="w-18 text-right bg-muted/20 border border-border/40 rounded-md px-1.5 py-0.5 pl-6 font-mono font-bold text-[10px] text-foreground"
                              />
                            </div>
                            {item.hasOverride && (
                              <span className="text-[7px] font-extrabold text-emerald-500 uppercase leading-none mt-0.5">Customizado</span>
                            )}
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="flex items-center gap-1.5 pl-2 border-l border-dashed border-border/60">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Subtotal:</span>
                          <span className="font-mono font-bold text-xs text-foreground bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                            R$ {(item.quantity * parseFloat(item.unitSalePrice || "0")).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Resumo Financeiro, Garantia e Auditoria (1/3) */}
        <div className="space-y-6">
          
          {/* 💰 Resumo Financeiro */}
          <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="size-4 text-emerald-500" />
              Consolidação Financeira
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-dashed border-border pb-2">
                <span className="text-muted-foreground">Total em Peças Aprovadas:</span>
                <span className="font-mono font-bold text-foreground">R$ {approvedPartsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-border pb-2">
                <span className="text-muted-foreground">Total em Serviços Aprovados:</span>
                <span className="font-mono font-bold text-foreground">R$ {approvedServicesTotal.toFixed(2)}</span>
              </div>

              {/* Desconto */}
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                <span className="text-muted-foreground">Desconto (R$):</span>
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 text-right bg-muted/20 border border-transparent hover:border-border rounded px-1.5 py-0.5 font-mono"
                />
              </div>

              {/* Acréscimo */}
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                <span className="text-muted-foreground">Acréscimo (R$):</span>
                <Input
                  type="number"
                  min="0"
                  value={surcharge}
                  onChange={(e) => setSurcharge(e.target.value)}
                  className="w-20 text-right bg-muted/20 border border-transparent hover:border-border rounded px-1.5 py-0.5 font-mono"
                />
              </div>

              {/* Prazo de Garantia */}
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                <span className="text-muted-foreground">Prazo de Garantia:</span>
                <Input
                  type="text"
                  placeholder="Ex: 90 dias, 1 ano"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-24 text-right bg-muted/20 border border-transparent hover:border-border rounded px-1.5 py-0.5 font-semibold text-[10px]"
                />
              </div>

              {/* Valor Geral Líquido */}
              <div className="flex justify-between items-center py-1 bg-emerald-500/5 px-2.5 rounded-lg border border-emerald-500/10">
                <span className="font-bold text-emerald-500">Valor Total Geral:</span>
                <span className="font-mono font-extrabold text-emerald-600 text-sm">R$ {grandTotal.toFixed(2)}</span>
              </div>

              {/* Lucro Estimado (Apenas Manager/Owner) */}
              {isUserAdmin && (
                <div className="flex justify-between items-center py-1 bg-blue-500/5 px-2.5 rounded-lg border border-blue-500/10">
                  <span className="font-bold text-blue-500">Lucro Estimado:</span>
                  <span className="font-mono font-extrabold text-blue-600">R$ {netProfit.toFixed(2)}</span>
                </div>
              )}

              {/* Comissão Mecânico */}
              {selectedMechanic && (
                <div className="flex justify-between items-center py-1 bg-amber-500/5 px-2.5 rounded-lg border border-amber-500/10">
                  <span className="font-bold text-amber-500">Comissão ({selectedMechanic.name}):</span>
                  <span className="font-mono font-extrabold text-amber-600">R$ {mechanicCommission.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Pagamento */}
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-dashed border-border pt-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Forma de Pagamento</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-semibold"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Status Pagamento</Label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-bold"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="LATE">Atrasado</option>
                </select>
              </div>
            </div>
          </div>

          {/* ℹ️ Bloco de Auditoria */}
          <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info className="size-4 text-emerald-500" />
              Auditoria e Filial
            </h2>
            <div className="text-[10px] text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Tenant ID:</span>
                <span className="font-mono text-[9px] truncate max-w-[150px]">{currentUser?.tenantId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Filial ID:</span>
                <span className="font-mono text-[9px] truncate max-w-[150px]">{currentUser?.branchId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Número O.S:</span>
                <span className="font-extrabold text-foreground">OS #PROVISÓRIA</span>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* 🕹️ Footer Fixo com Barra de Status e Ações Primárias (Estilo Jeet) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border p-4 shadow-[0_-5px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Esteira Horizontal de Status */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {statusSteps.map((step, idx) => {
              const active = osStatus === step.key
              return (
                <div key={step.key} className="flex items-center shrink-0">
                  <Button
                    type="button"
                    onClick={() => setOsStatus(step.key as any)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all relative ${
                      active 
                        ? "bg-foreground text-background scale-105" 
                        : "bg-muted/40 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span>{step.label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeStatusIndicator"
                        className="absolute inset-0 rounded-full border-2 border-emerald-500 pointer-events-none"
                        transition={springConfig}
                      />
                    )}
                  </Button>
                  {idx < statusSteps.length - 1 && (
                    <div className="w-4 h-px bg-border/80 mx-1 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Printer — only visible in edit mode when OS already exists */}
            {editId && (
              <NewOSPrinterPopover
                orderId={editId}
                osNumber={editOsNumber}
                status={osStatus}
              />
            )}

            <Button
              type="button"
              onClick={handleContextualAction}
              className="bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-full px-5 py-2.5 transition-all active:scale-95 shrink-0"
            >
              {getPrimaryButtonText()}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveOS}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-full px-6 py-2.5 transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>{editId ? "Atualizar O.S." : "Salvar O.S."}</span>
                </>
              )}
            </Button>
          </div>

        </div>
      </div>

      {/* Lightbox / Zoom da Foto */}
      <AnimatePresence>
        {activeLightboxPhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={springConfig}
              className="relative max-w-4xl w-full h-full flex items-center justify-center"
            >
              <Button
                type="button"
                onClick={() => setActiveLightboxPhoto(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all z-50 p-0 bg-transparent border-0"
              >
                <X className="size-5" />
              </Button>
              <img src={activeLightboxPhoto} alt="Zoom Check-in" className="max-h-[85vh] max-w-full object-contain rounded-xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
