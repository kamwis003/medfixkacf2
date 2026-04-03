import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ROUTES } from '@/routes/paths'
import { apiRequest } from '@/utils/api'
import { Input } from '@/components/ui/input'
import type { DiaryEntry, ListDiaryResponse } from '@/types/endometriosis'
interface IPatientProfile {
  id: string
  firstName: string
  lastName: string
}

interface IPatientsListResponse {
  data: IPatientProfile[]
}

export const PatientsPage: React.FC = () => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const [patients, setPatients] = React.useState<IPatientProfile[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  const [lastEntries, setLastEntries] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setIsLoading(true)
    apiRequest<IPatientsListResponse>('/patients')
      .then(data => {
        setPatients(data.data ?? [])
      })
      .catch(e => {
        setError(e.message || 'Failed to load patients.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  React.useEffect(() => {
    async function fetchAndMapLastEntries() {
      try {
        const res = await apiRequest<ListDiaryResponse>('/diary-entries', { method: 'GET' })
        const entries: DiaryEntry[] = res.data ?? []
        const result: Record<string, string> = {}
        entries.forEach(entry => {
          const userId = entry.userId
          if (!result[userId] || entry.date > result[userId]) result[userId] = entry.date
        })
        setLastEntries(result)
      } catch {
      }
    }
    fetchAndMapLastEntries()
  }, [])

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const filteredPatients = patients.filter(
    p =>
      !search ||
      normalize(p.firstName).includes(normalize(search)) ||
      normalize(p.lastName).includes(normalize(search))
  )
  function formatDateDMY(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`
}

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Card className="mx-auto w-full">
        <CardHeader>
          <CardTitle>{t('patients.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="text"
              placeholder={t('patients.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {isLoading ? (
            <div className="text-center">{t('patients.loading')}</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">{t('patients.firstName')}</th>
                    <th className="text-left p-2">{t('patients.lastName')}</th>
                    <th className="text-left p-2">{t('patients.lastActivity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted-foreground py-12">
                        {t('patients.noMatches')}
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => navigate(ROUTES.PATIENTS.DETAIL(p.id))}
                      >
                        <td className="p-2">{p.firstName}</td>
                        <td className="p-2">{p.lastName}</td>
                        <td className="p-2">
                          {lastEntries[p.id]
                          ? formatDateDMY(lastEntries[p.id])
                          : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}