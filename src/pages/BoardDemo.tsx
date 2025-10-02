import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Trash2, Menu, ChevronDown, ChevronUp, Check, X } from "lucide-react";

interface Task {
  id: string;
  title: string;
  note: string;
  priority: "Laag" | "Medium" | "Hoog";
  label: string;
}

interface SimpleCard {
  id: string;
  name: string;
  reason: string;
}

const BoardDemo = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Dummy data
  const vandaagTaken: Task[] = [
    {
      id: "1",
      title: "Offerte opstellen voor nieuwbouw project",
      note: "Klant wacht op prijsindicatie",
      priority: "Hoog",
      label: "Algemeen",
    },
    {
      id: "2",
      title: "Verificatie slimme meter installatie",
      note: "Adres: Dorpstraat 12",
      priority: "Medium",
      label: "Algemeen",
    },
    {
      id: "3",
      title: "Team meeting voorbereiden",
      note: "Agenda doorsturen",
      priority: "Laag",
      label: "Algemeen",
    },
  ];

  const dezeWeekTaken: Task[] = [
    {
      id: "4",
      title: "Inspectie zonnepanelen",
      note: "Planning maken",
      priority: "Medium",
      label: "Algemeen",
    },
    {
      id: "5",
      title: "Materiaal bestellen",
      note: "Voorraad controleren",
      priority: "Hoog",
      label: "Algemeen",
    },
    {
      id: "6",
      title: "Update website",
      note: "Nieuwe projecten toevoegen",
      priority: "Laag",
      label: "Algemeen",
    },
  ];

  const ziekPersonen: SimpleCard[] = [
    { id: "z1", name: "Jan Pietersen", reason: "Griep (tot vrijdag)" },
  ];

  const verlofPersonen: SimpleCard[] = [
    { id: "v1", name: "Maria de Vries", reason: "Vakantie (hele week)" },
    { id: "v2", name: "Piet Jansen", reason: "Persoonlijk verlof" },
    { id: "v3", name: "Klaas Mulder", reason: "Zorgverlof" },
  ];

  const afgerondTaken: Task[] = [
    {
      id: "a1",
      title: "Factuur versturen",
      note: "Project Bakkerstraat afgerond",
      priority: "Medium",
      label: "Algemeen",
    },
  ];

  const infoItems: SimpleCard[] = [
    { id: "i1", name: "Leveringstijden materiaal", reason: "Let op: 2 weken vertraging" },
    { id: "i2", name: "Nieuwe veiligheidsregels", reason: "Vanaf volgende maand van kracht" },
    { id: "i3", name: "Klantenfeedback", reason: "Gemiddeld 4.8/5 deze maand" },
    { id: "i4", name: "Teamuitje plannen", reason: "Datum prikken voor Q2" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Hoog":
        return "bg-red-100 text-red-700 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Laag":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-card rounded-[18px] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.08)] hover:shadow-[0_15px_40px_rgba(2,6,23,0.12)] transition-all duration-200 border border-border/50">
      <div className="flex items-start gap-3">
        <button className="text-muted-foreground hover:text-foreground mt-1 cursor-grab active:cursor-grabbing">
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground mb-1 leading-snug">
            {task.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">{task.note}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
              {task.label}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Prioriteit verlagen"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Prioriteit verhogen"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-600"
              title="Markeer als afgerond"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              title="Verwijderen"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const SimpleTaskCard = ({ card }: { card: SimpleCard }) => (
    <div className="bg-card rounded-[18px] p-3 shadow-[0_10px_30px_rgba(2,6,23,0.08)] hover:shadow-[0_15px_40px_rgba(2,6,23,0.12)] transition-all duration-200 border border-border/50">
      <div className="flex items-start gap-2">
        <button className="text-muted-foreground hover:text-foreground mt-0.5 cursor-grab active:cursor-grabbing">
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground mb-0.5 leading-snug">
            {card.name}
          </h4>
          <p className="text-xs text-muted-foreground">{card.reason}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
          title="Verwijderen"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-green-50 border-b border-green-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl">
                N
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  NRG TOTAAL – To-Do Board
                </h1>
                <p className="text-sm text-muted-foreground">
                  Live overzicht voor het team – dubbelklik op een taak om te bewerken • Sleep om te ordenen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {formatDate(currentTime)}
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Maximize2 className="h-4 w-4" />
                Volledig scherm
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Leeg Afgerond
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Kolom 1: Vandaag */}
          <div className="flex flex-col min-h-[600px]">
            <div className="bg-card rounded-t-[18px] border border-border px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">📅 Vandaag</h2>
                <Button size="sm" variant="ghost" className="text-xs h-7">
                  + Taak
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-card/50 rounded-b-[18px] border-x border-b border-border p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {vandaagTaken.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Kolom 2: Deze week */}
          <div className="flex flex-col min-h-[600px]">
            <div className="bg-card rounded-t-[18px] border border-border px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">📆 Deze week</h2>
                <Button size="sm" variant="ghost" className="text-xs h-7">
                  + Taak
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-card/50 rounded-b-[18px] border-x border-b border-border p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {dezeWeekTaken.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Kolom 3: Ziek / Verlof (stacked) */}
          <div className="flex flex-col gap-4 min-h-[600px]">
            {/* Ziek */}
            <div className="flex flex-col flex-1">
              <div className="bg-red-100 rounded-t-[18px] border border-red-200 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-red-800">🤒 Ziek</h2>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-red-800 hover:bg-red-200">
                    + Toevoegen
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-red-50/50 rounded-b-[18px] border-x border-b border-red-200 p-3 overflow-y-auto space-y-2 custom-scrollbar">
                {ziekPersonen.map((person) => (
                  <SimpleTaskCard key={person.id} card={person} />
                ))}
              </div>
            </div>

            {/* Verlof */}
            <div className="flex flex-col flex-1">
              <div className="bg-green-100 rounded-t-[18px] border border-green-200 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-green-800">🏖️ Verlof</h2>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-green-800 hover:bg-green-200">
                    + Toevoegen
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-green-50/50 rounded-b-[18px] border-x border-b border-green-200 p-3 overflow-y-auto space-y-2 custom-scrollbar">
                {verlofPersonen.map((person) => (
                  <SimpleTaskCard key={person.id} card={person} />
                ))}
              </div>
            </div>
          </div>

          {/* Kolom 4: Afgerond / Belangrijke informatie (stacked) */}
          <div className="flex flex-col gap-4 min-h-[600px]">
            {/* Afgerond */}
            <div className="flex flex-col flex-1">
              <div className="bg-card rounded-t-[18px] border border-border px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">✅ Afgerond</h2>
                    <Badge variant="secondary" className="text-xs">
                      {afgerondTaken.length}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-card/50 rounded-b-[18px] border-x border-b border-border p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {afgerondTaken.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* Belangrijke informatie */}
            <div className="flex flex-col flex-1">
              <div className="bg-card rounded-t-[18px] border border-border px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">ℹ️ Belangrijke informatie</h2>
                  <Button size="sm" variant="ghost" className="text-xs h-7">
                    + Toevoegen
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-card/50 rounded-b-[18px] border-x border-b border-border p-3 overflow-y-auto space-y-2 custom-scrollbar">
                {infoItems.map((item) => (
                  <SimpleTaskCard key={item.id} card={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-6 py-4 text-center text-sm text-muted-foreground">
        <p>
          💡 <strong>Sneltoetsen:</strong> N = nieuwe taak, F = fullscreen, 1–3 = prio aanpassen
          • Data wordt lokaal opgeslagen (localStorage)
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.3);
        }
      `}</style>
    </div>
  );
};

export default BoardDemo;
